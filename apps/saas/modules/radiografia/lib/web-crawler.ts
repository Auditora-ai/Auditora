/**
 * Web Crawler for Radiografia
 *
 * Crawls a company website to extract business context.
 * Server-side only — used by the crawl API route.
 *
 * Strategy:
 * 1. Fetch homepage, extract text + internal links
 * 2. Follow up to 4 high-value internal pages (/about, /services, etc.)
 * 3. Strip nav/footer/scripts, concatenate clean text
 * 4. Truncate to 3000 words max
 */

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

	const visited = new Set<string>();
	const texts: string[] = [];

	// Fetch homepage first
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

	// Find high-value internal links
	const internalLinks = extractInternalLinks(
		homepageText.html,
		baseUrl,
	).filter((link) => !visited.has(link));

	// Prioritize known high-value paths
	const prioritized = prioritizeLinks(internalLinks, baseUrl);

	// Fetch up to MAX_PAGES - 1 more pages
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

function normalizeUrl(input: string): string | null {
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
	// Remove script, style, nav, footer, header elements
	let cleaned = html
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<nav[\s\S]*?<\/nav>/gi, "")
		.replace(/<footer[\s\S]*?<\/footer>/gi, "")
		.replace(/<header[\s\S]*?<\/header>/gi, "")
		.replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
		.replace(/<!--[\s\S]*?-->/g, "");

	// Replace block elements with newlines
	cleaned = cleaned.replace(
		/<\/(p|div|h[1-6]|li|tr|br|section|article)>/gi,
		"\n",
	);

	// Remove all remaining HTML tags
	cleaned = cleaned.replace(/<[^>]+>/g, " ");

	// Decode common HTML entities
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

	// Normalize whitespace
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

function prioritizeLinks(links: string[], baseUrl: string): string[] {
	const scored = links.map((link) => {
		const path = new URL(link).pathname.toLowerCase();
		const priorityIndex = PRIORITY_PATHS.findIndex(
			(p) => path === p || path === `${p}/`,
		);
		return {
			link,
			score: priorityIndex >= 0 ? 100 - priorityIndex : 0,
		};
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
