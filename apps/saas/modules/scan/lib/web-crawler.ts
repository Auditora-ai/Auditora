/**
 * Simplified Web Crawler
 *
 * Fetches a URL, extracts clean text content (stripping HTML tags, scripts,
 * styles), and returns the first 3000 words. Uses native fetch with a 10s
 * timeout and a bot user-agent.
 *
 * Falls back to Firecrawl API when FIRECRAWL_API_KEY is set.
 */

const BOT_USER_AGENT =
	"Mozilla/5.0 (compatible; AuditoraBot/1.0; +https://auditora.ai)";
const MAX_WORDS = 3000;
const FETCH_TIMEOUT_MS = 10_000;

interface CrawlResult {
	text: string;
	title: string;
	success: boolean;
}

// ── HTML cleaning utilities ─────────────────────────────────────────────────

function extractTitle(html: string): string {
	const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
	return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function stripHtml(html: string): string {
	// Remove script and style blocks entirely
	let clean = html.replace(
		/<script[\s\S]*?<\/script>/gi,
		" ",
	);
	clean = clean.replace(
		/<style[\s\S]*?<\/style>/gi,
		" ",
	);
	// Remove HTML comments
	clean = clean.replace(/<!--[\s\S]*?-->/g, " ");
	// Remove all remaining tags
	clean = clean.replace(/<[^>]+>/g, " ");
	// Decode common HTML entities
	clean = clean
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ");
	// Collapse whitespace
	clean = clean.replace(/\s+/g, " ").trim();
	return clean;
}

function truncateToWords(text: string, maxWords: number): string {
	const words = text.split(/\s+/);
	if (words.length <= maxWords) return text;
	return words.slice(0, maxWords).join(" ");
}

// ── Firecrawl fallback ──────────────────────────────────────────────────────

async function crawlWithFirecrawl(url: string): Promise<CrawlResult> {
	const apiKey = process.env.FIRECRAWL_API_KEY;
	if (!apiKey) {
		return { text: "", title: "", success: false };
	}

	try {
		const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				url,
				formats: ["markdown"],
			}),
			signal: AbortSignal.timeout(15_000),
		});

		if (!response.ok) {
			return { text: "", title: "", success: false };
		}

		const data = await response.json();
		const markdown = data?.data?.markdown || "";
		const title = data?.data?.metadata?.title || "";

		if (!markdown) {
			return { text: "", title: "", success: false };
		}

		return {
			text: truncateToWords(markdown, MAX_WORDS),
			title,
			success: true,
		};
	} catch {
		return { text: "", title: "", success: false };
	}
}

// ── Main crawler ────────────────────────────────────────────────────────────

async function crawlWithFetch(url: string): Promise<CrawlResult> {
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": BOT_USER_AGENT,
				Accept: "text/html,application/xhtml+xml",
			},
			redirect: "follow",
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});

		if (!response.ok) {
			return { text: "", title: "", success: false };
		}

		const contentType = response.headers.get("content-type") || "";
		if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
			return { text: "", title: "", success: false };
		}

		const html = await response.text();
		const title = extractTitle(html);
		const cleanText = stripHtml(html);
		const truncated = truncateToWords(cleanText, MAX_WORDS);

		if (truncated.split(/\s+/).length < 20) {
			// Too little text — probably a JS-rendered SPA
			return { text: "", title, success: false };
		}

		return {
			text: truncated,
			title,
			success: true,
		};
	} catch {
		return { text: "", title: "", success: false };
	}
}

// ── Public export ───────────────────────────────────────────────────────────

export async function crawlWebsite(url: string): Promise<CrawlResult> {
	// Normalize URL
	let normalizedUrl = url.trim();
	if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
		normalizedUrl = `https://${normalizedUrl}`;
	}

	// Try native fetch first
	const fetchResult = await crawlWithFetch(normalizedUrl);
	if (fetchResult.success) {
		return fetchResult;
	}

	// Fall back to Firecrawl if API key is configured
	if (process.env.FIRECRAWL_API_KEY) {
		const firecrawlResult = await crawlWithFirecrawl(normalizedUrl);
		if (firecrawlResult.success) {
			return firecrawlResult;
		}
	}

	// Return whatever we got (even empty) so caller can handle gracefully
	return fetchResult;
}
