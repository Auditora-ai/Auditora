/**
 * Web Crawler for Radiografia
 *
 * Crawls a company website to extract business context.
 * Server-side only — used by the crawl API route.
 *
 * Strategy:
 * 1. If FIRECRAWL_API_KEY is set, use Firecrawl API (handles JS rendering, anti-bot)
 * 2. Otherwise, fall back to native fetch (static HTML only)
 *
 * Both paths return the same CrawlResult interface.
 */

import FirecrawlApp from "@mendable/firecrawl-js";

const PRIORITY_PATHS = [
	"/about",
	"/about-us",
	"/nosotros",
	"/quienes-somos",
	"/services",
	"/servicios",
	"/products",
	"/productos",
	"/what-we-do",
	"/que-hacemos",
	"/company",
	"/empresa",
	"/solutions",
	"/soluciones",
];

const MAX_PAGES = 5;
const FETCH_TIMEOUT_MS = 5000;
const MAX_WORDS = 3000;

export interface CrawlResult {
	success: boolean;
	url: string;
	pagesFound: number;
	businessContext: string;
	error?: string;
}

export async function crawlWebsite(url: string): Promise<CrawlResult> {
	const baseUrl = normalizeUrl(url);
	if (!baseUrl) {
		return {
			success: false,
			url,
			pagesFound: 0,
			businessContext: "",
			error: "URL invalida",
		};
	}

	if (process.env.FIRECRAWL_API_KEY) {
		return crawlWithFirecrawl(baseUrl);
	}

	return crawlWithFetch(baseUrl);
}

// ---------------------------------------------------------------------------
// Firecrawl API path (JS rendering, anti-bot)
// ---------------------------------------------------------------------------

async function crawlWithFirecrawl(baseUrl: string): Promise<CrawlResult> {
	const firecrawl = new FirecrawlApp({
		apiKey: process.env.FIRECRAWL_API_KEY!,
	});

	try {
		// Scrape homepage — get markdown + links
		const homepage = await firecrawl.scrapeUrl(baseUrl, {
			formats: ["markdown", "links"],
			onlyMainContent: true,
			timeout: 10000,
		});

		if (!homepage.success) {
			return {
				success: false,
				url: baseUrl,
				pagesFound: 0,
				businessContext: "",
				error: homepage.error || "No pudimos acceder al sitio web",
			};
		}

		const texts: string[] = [];
		texts.push(`[Pagina principal]\n${homepage.markdown || ""}`);

		// Find priority internal pages from discovered links
		const discoveredLinks = (homepage.links || []).filter(
			(link) => {
				try {
					const parsed = new URL(link);
					return parsed.origin === new URL(baseUrl).origin;
				} catch {
					return false;
				}
			},
		);

		const prioritized = prioritizeLinks(discoveredLinks, baseUrl);
		const pagesToFetch = prioritized.slice(0, MAX_PAGES - 1);

		// Scrape priority pages in parallel
		const pageResults = await Promise.allSettled(
			pagesToFetch.map(async (link) => {
				const result = await firecrawl.scrapeUrl(link, {
					formats: ["markdown"],
					onlyMainContent: true,
					timeout: 10000,
				});
				if (!result.success) return null;
				return { url: link, markdown: result.markdown || "" };
			}),
		);

		for (const result of pageResults) {
			if (result.status === "fulfilled" && result.value) {
				const path = new URL(result.value.url).pathname;
				texts.push(`[${path}]\n${result.value.markdown}`);
			}
		}

		const fullText = texts.join("\n\n");
		const truncated = truncateToWords(fullText, MAX_WORDS);

		return {
			success: true,
			url: baseUrl,
			pagesFound: 1 + pageResults.filter(
				(r) => r.status === "fulfilled" && r.value,
			).length,
			businessContext: truncated,
		};
	} catch (err) {
		return {
			success: false,
			url: baseUrl,
			pagesFound: 0,
			businessContext: "",
			error: "Error al acceder al sitio web",
		};
	}
}

// ---------------------------------------------------------------------------
// Native fetch fallback (static HTML only — no JS rendering)
// ---------------------------------------------------------------------------

async function crawlWithFetch(baseUrl: string): Promise<CrawlResult> {
	const visited = new Set<string>();
	const texts: string[] = [];

	const homepageText = await fetchAndExtract(baseUrl);
	if (!homepageText) {
		return {
			success: false,
			url: baseUrl,
			pagesFound: 0,
			businessContext: "",
			error: "No pudimos acceder al sitio web",
		};
	}

	visited.add(baseUrl);
	texts.push(`[Pagina principal]\n${homepageText.text}`);

	const internalLinks = extractInternalLinks(
		homepageText.html,
		baseUrl,
	).filter((link) => !visited.has(link));

	const prioritized = prioritizeLinks(internalLinks, baseUrl);
	const pagesToFetch = prioritized.slice(0, MAX_PAGES - 1);
	const pageResults = await Promise.allSettled(
		pagesToFetch.map((link) => fetchAndExtract(link)),
	);

	for (let i = 0; i < pageResults.length; i++) {
		const result = pageResults[i];
		if (result?.status === "fulfilled" && result.value) {
			const pagePath = new URL(pagesToFetch[i]!).pathname;
			texts.push(`[${pagePath}]\n${result.value.text}`);
			visited.add(pagesToFetch[i]!);
		}
	}

	const fullText = texts.join("\n\n");
	const truncated = truncateToWords(fullText, MAX_WORDS);

	return {
		success: true,
		url: baseUrl,
		pagesFound: visited.size,
		businessContext: truncated,
	};
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

export function normalizeUrl(input: string): string | null {
	try {
		let url = input.trim();
		if (!url.startsWith("http://") && !url.startsWith("https://")) {
			url = `https://${url}`;
		}
		const parsed = new URL(url);

		// Block private/local IPs
		const hostname = parsed.hostname.toLowerCase();
		if (
			hostname === "localhost" ||
			hostname === "127.0.0.1" ||
			hostname.startsWith("192.168.") ||
			hostname.startsWith("10.") ||
			hostname.startsWith("172.") ||
			hostname.endsWith(".local")
		) {
			return null;
		}

		return parsed.origin;
	} catch {
		return null;
	}
}

function prioritizeLinks(links: string[], baseUrl: string): string[] {
	const scored = links.map((link) => {
		try {
			const path = new URL(link).pathname.toLowerCase();
			const priorityIndex = PRIORITY_PATHS.findIndex(
				(p) => path === p || path === `${p}/`,
			);
			return {
				link,
				score: priorityIndex >= 0 ? 100 - priorityIndex : 0,
			};
		} catch {
			return { link, score: 0 };
		}
	});

	return scored
		.sort((a, b) => b.score - a.score)
		.map((s) => s.link);
}

function truncateToWords(text: string, maxWords: number): string {
	const words = text.split(/\s+/);
	if (words.length <= maxWords) return text;
	return words.slice(0, maxWords).join(" ") + "...";
}

// ---------------------------------------------------------------------------
// Native fetch helpers (used only in fallback path)
// ---------------------------------------------------------------------------

async function fetchAndExtract(
	url: string,
): Promise<{ text: string; html: string } | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(
			() => controller.abort(),
			FETCH_TIMEOUT_MS,
		);

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; AuditoraBot/1.0; +https://auditora.ai)",
				Accept: "text/html",
			},
			redirect: "follow",
		});

		clearTimeout(timeout);

		if (!response.ok) return null;

		const contentType = response.headers.get("content-type") || "";
		if (!contentType.includes("text/html")) return null;

		const html = await response.text();
		const text = extractTextFromHtml(html);

		return text.length > 20 ? { text, html } : null;
	} catch {
		return null;
	}
}

function extractTextFromHtml(html: string): string {
	let cleaned = html
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<nav[\s\S]*?<\/nav>/gi, "")
		.replace(/<footer[\s\S]*?<\/footer>/gi, "")
		.replace(/<header[\s\S]*?<\/header>/gi, "")
		.replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
		.replace(/<!--[\s\S]*?-->/g, "");

	cleaned = cleaned.replace(
		/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi,
		"\n",
	);

	cleaned = cleaned.replace(/<[^>]+>/g, " ");

	cleaned = cleaned
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&aacute;/g, "á")
		.replace(/&eacute;/g, "é")
		.replace(/&iacute;/g, "í")
		.replace(/&oacute;/g, "ó")
		.replace(/&uacute;/g, "ú")
		.replace(/&ntilde;/g, "ñ");

	cleaned = cleaned
		.split("\n")
		.map((line) => line.replace(/\s+/g, " ").trim())
		.filter((line) => line.length > 0)
		.join("\n");

	return cleaned;
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
	const links: string[] = [];
	const hrefRegex = /href=["']([^"']+)["']/gi;
	let match: RegExpExecArray | null;

	while ((match = hrefRegex.exec(html)) !== null) {
		const href = match[1];
		if (!href) continue;

		try {
			const resolved = new URL(href, baseUrl);
			if (
				resolved.origin === baseUrl &&
				!resolved.hash &&
				!resolved.pathname.match(
					/\.(pdf|jpg|png|gif|svg|css|js|ico|woff|ttf)$/i,
				)
			) {
				const normalized = `${resolved.origin}${resolved.pathname}`;
				if (!links.includes(normalized)) {
					links.push(normalized);
				}
			}
		} catch {
			// Skip invalid URLs
		}
	}

	return links;
}
