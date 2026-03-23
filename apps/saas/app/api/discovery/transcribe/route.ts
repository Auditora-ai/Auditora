/**
 * Discovery Transcribe API
 *
 * POST /api/discovery/transcribe — Upload audio file and transcribe with Deepgram
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

async function getAuthContext() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;
	return { user: session.user };
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
	"audio/mpeg",
	"audio/wav",
	"audio/x-wav",
	"audio/mp4",
	"audio/x-m4a",
	"audio/mp3",
	"audio/webm",
];

export async function POST(request: NextRequest) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get("audio") as File | null;

		if (!file) {
			return NextResponse.json(
				{ error: "No audio file provided" },
				{ status: 400 },
			);
		}

		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: "File too large. Maximum 50MB." },
				{ status: 400 },
			);
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return NextResponse.json(
				{
					error: `Unsupported audio format: ${file.type}. Use mp3, wav, or m4a.`,
				},
				{ status: 400 },
			);
		}

		const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
		if (!deepgramApiKey) {
			return NextResponse.json(
				{ error: "Transcription service not configured" },
				{ status: 500 },
			);
		}

		// Send to Deepgram batch API
		const audioBuffer = await file.arrayBuffer();

		const response = await fetch(
			"https://api.deepgram.com/v1/listen?model=nova-3&language=es&punctuate=true&paragraphs=true",
			{
				method: "POST",
				headers: {
					Authorization: `Token ${deepgramApiKey}`,
					"Content-Type": file.type,
				},
				body: audioBuffer,
			},
		);

		if (!response.ok) {
			const errorText = await response.text();
			console.error("[Transcribe] Deepgram error:", errorText);
			return NextResponse.json(
				{ error: "Transcription failed. Try a different audio file." },
				{ status: 500 },
			);
		}

		const result = await response.json();
		const transcript =
			result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

		if (!transcript) {
			return NextResponse.json(
				{ error: "No speech detected in the audio file." },
				{ status: 422 },
			);
		}

		// Chunk long transcripts into ~1000 word segments
		const words = transcript.split(/\s+/);
		const chunks: string[] = [];
		const CHUNK_SIZE = 1000;

		if (words.length <= CHUNK_SIZE) {
			chunks.push(transcript);
		} else {
			for (let i = 0; i < words.length; i += CHUNK_SIZE) {
				chunks.push(words.slice(i, i + CHUNK_SIZE).join(" "));
			}
		}

		return NextResponse.json({
			transcript,
			chunks,
			wordCount: words.length,
			duration: result?.metadata?.duration,
		});
	} catch (error) {
		console.error("[Transcribe POST]", error);
		return NextResponse.json(
			{ error: "Failed to transcribe audio" },
			{ status: 500 },
		);
	}
}
