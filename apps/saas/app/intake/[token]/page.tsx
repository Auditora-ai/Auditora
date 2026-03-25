"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface IntakeQuestion {
	questionKey: string;
	questionText: string;
	response: string | null;
	respondedAt: string | null;
}

interface IntakeData {
	processName: string;
	organizationName: string;
	scheduledFor: string | null;
	sessionType: string;
	contactName: string | null;
	questions: IntakeQuestion[];
}

export default function IntakePage() {
	const params = useParams();
	const token = params.token as string;

	const [data, setData] = useState<IntakeData | null>(null);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch(`/api/intake/${token}`)
			.then((res) => {
				if (!res.ok) throw new Error("Not found");
				return res.json();
			})
			.then((d: IntakeData) => {
				setData(d);
				// Pre-fill existing responses
				const existing: Record<string, string> = {};
				for (const q of d.questions) {
					if (q.response) existing[q.questionKey] = q.response;
				}
				setAnswers(existing);

				// If all already answered, show submitted state
				if (d.questions.length > 0 && d.questions.every((q) => q.response)) {
					setSubmitted(true);
				}
			})
			.catch(() => setError("Este enlace no es válido o ha expirado."))
			.finally(() => setLoading(false));
	}, [token]);

	const handleSubmit = async () => {
		if (!data) return;
		setSubmitting(true);

		const responses = Object.entries(answers)
			.filter(([, v]) => v.trim().length > 0)
			.map(([questionKey, response]) => ({ questionKey, response }));

		try {
			const res = await fetch(`/api/intake/${token}/respond`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ responses }),
			});
			if (!res.ok) throw new Error("Error al enviar");
			setSubmitted(true);
		} catch {
			setError("Error al enviar las respuestas. Intenta de nuevo.");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50">
				<div className="text-slate-400">Cargando...</div>
			</div>
		);
	}

	if (error && !data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50">
				<div className="max-w-md text-center">
					<h1 className="mb-2 text-2xl font-semibold text-slate-900">Enlace no válido</h1>
					<p className="text-slate-500">{error}</p>
				</div>
			</div>
		);
	}

	if (!data) return null;

	const scheduledDate = data.scheduledFor
		? new Date(data.scheduledFor).toLocaleDateString("es-MX", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	const sessionTypeLabels: Record<string, string> = {
		DISCOVERY: "Descubrimiento",
		DEEP_DIVE: "Profundización",
		CONTINUATION: "Continuación",
	};

	const answeredCount = Object.values(answers).filter((v) => v.trim().length > 0).length;

	if (submitted) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50">
				<div className="max-w-md text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h1 className="mb-2 text-2xl font-semibold text-slate-900">Respuestas enviadas</h1>
					<p className="text-slate-500">
						Gracias por tu tiempo. Tu consultor revisará esta información antes de la sesión
						{scheduledDate ? ` del ${scheduledDate}` : ""}.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 py-8">
			<div className="mx-auto max-w-2xl px-4">
				{/* Header */}
				<div className="mb-8">
					<div className="mb-1 text-sm font-medium text-blue-600">aiprocess.me</div>
					<h1 className="mb-2 text-2xl font-semibold text-slate-900">
						Preparación para sesión de levantamiento
					</h1>
					<p className="text-slate-500">
						{data.organizationName} te invita a preparar información para la sesión sobre{" "}
						<span className="font-medium text-slate-700">{data.processName}</span>.
					</p>
				</div>

				{/* Session info */}
				<div className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
					<div className="flex flex-wrap gap-4 text-sm">
						<div>
							<span className="text-slate-400">Proceso:</span>{" "}
							<span className="font-medium text-slate-700">{data.processName}</span>
						</div>
						<div>
							<span className="text-slate-400">Tipo:</span>{" "}
							<span className="font-medium text-slate-700">
								{sessionTypeLabels[data.sessionType] ?? data.sessionType}
							</span>
						</div>
						{scheduledDate && (
							<div>
								<span className="text-slate-400">Fecha:</span>{" "}
								<span className="font-medium text-slate-700">{scheduledDate}</span>
							</div>
						)}
					</div>
				</div>

				{/* Questions */}
				<div className="space-y-6">
					<h2 className="text-lg font-semibold text-slate-900">
						Preguntas ({answeredCount}/{data.questions.length} respondidas)
					</h2>

					{data.questions.map((q, i) => (
						<div key={q.questionKey} className="rounded-lg border border-slate-200 bg-white p-4">
							<label className="mb-2 block text-sm font-medium text-slate-700">
								{i + 1}. {q.questionText}
							</label>
							<textarea
								className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								rows={3}
								placeholder="Escribe tu respuesta aquí..."
								value={answers[q.questionKey] ?? ""}
								onChange={(e) =>
									setAnswers((prev) => ({
										...prev,
										[q.questionKey]: e.target.value,
									}))
								}
							/>
						</div>
					))}
				</div>

				{/* Submit */}
				{error && (
					<div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
						{error}
					</div>
				)}

				<div className="mt-8 flex justify-end">
					<button
						onClick={handleSubmit}
						disabled={submitting || answeredCount === 0}
						className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{submitting ? "Enviando..." : `Enviar ${answeredCount} respuesta${answeredCount !== 1 ? "s" : ""}`}
					</button>
				</div>

				<p className="mt-4 text-center text-xs text-slate-400">
					Powered by aiprocess.me — Plataforma de levantamiento de procesos con IA
				</p>
			</div>
		</div>
	);
}
