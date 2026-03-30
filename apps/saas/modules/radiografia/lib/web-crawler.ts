/**
 * Web Crawler for Radiografia
 *
 * Crawls a company website to extract business context as Markdown.
 * Server-side only — used by the crawl API route.
 *
 * Strategy (credit-conscious):
 * 1. Always try native fetch first (free, fast, works for static sites)
 * 2. If fetch returns too little content (<150 words), escalate to Firecrawl
 * 3. Firecrawl only scrapes what's needed — homepage first, subpages only
 *    if homepage alone is insufficient
 *
 * Both paths output Markdown — optimal for LLM consumption.
 * Static sites = 0 credits. JS-heavy sites = 1-3 credits max.
 */

import Firecrawl from "@mendable/firecrawl-js";
import { NodeHtmlMarkdown } from "node-html-markdown";

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

/** Paths that waste credits — never worth scraping */
const SKIP_PATHS = [
	"/privacy",
	"/privacy-policy",
	"/politica-de-privacidad",
	"/terms",
	"/terms-of-service",
	"/terminos",
	"/cookie",
	"/cookies",
	"/legal",
	"/aviso-legal",
	"/login",
	"/signin",
	"/sign-in",
	"/register",
	"/signup",
	"/sign-up",
	"/cart",
	"/checkout",
	"/blog",
	"/sitemap",
	"/feed",
	"/rss",
];

const MAX_PAGES = 5;
const FETCH_TIMEOUT_MS = 8000;
const MAX_WORDS = 3000;

/**
 * Minimum words to consider a page "useful".
 * Below this, the page likely didn't render (SPA) or is a redirect.
 */
const MIN_USEFUL_WORDS = 50;

/**
 * Minimum words for the full crawl to skip Firecrawl escalation.
 * If native fetch gets at least this much, we have enough context.
 */
const MIN_SUFFICIENT_WORDS = 150;

/** Reusable converter — configured once for clean LLM-friendly output */
const htmlToMd = new NodeHtmlMarkdown({
	ignore: ["script", "style", "nav", "footer", "noscript", "svg", "iframe", "form"],
	blockElements: ["div", "section", "article", "main", "aside", "header", "figure"],
});

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

	// Step 1: Always try native fetch first (free)
	const fetchResult = await crawlWithFetch(baseUrl);

	// Step 2: If fetch got enough content, use it — no credits spent
	const wordCount = countWords(fetchResult.businessContext);
	if (fetchResult.success && wordCount >= MIN_SUFFICIENT_WORDS) {
		return fetchResult;
	}

	// Step 3: Escalate to Firecrawl if available
	if (process.env.FIRECRAWL_API_KEY) {
		const firecrawlResult = await crawlWithFirecrawl(baseUrl);
		if (firecrawlResult.success) {
			return firecrawlResult;
		}
	}

	// Step 4: Return whatever fetch got (even if sparse), or its error
	return fetchResult;
}

// ---------------------------------------------------------------------------
// Firecrawl API path (JS rendering, anti-bot) — credit-conscious
// ---------------------------------------------------------------------------

async function crawlWithFirecrawl(baseUrl: string): Promise<CrawlResult> {
	const firecrawl = new Firecrawl();

	try {
		// Credit 1: scrape homepage with links discovery
		const homepage = await firecrawl.scrape(baseUrl, {
			formats: ["markdown", "links"],
			onlyMainContent: true,
			timeout: 15000,
		});

		const texts: string[] = [];
		const homepageMarkdown = homepage.markdown || "";
		texts.push(`## Pagina principal\n\n${homepageMarkdown}`);

		const homepageWords = countWords(homepageMarkdown);

		// Only spend more credits if homepage alone isn't enough
		if (homepageWords < MIN_SUFFICIENT_WORDS) {
			const baseOrigin = new URL(baseUrl).origin;
			const discoveredLinks = (homepage.links || []).filter(
				(link: string) => {
					try {
						return new URL(link).origin === baseOrigin;
					} catch {
						return false;
					}
				},
			);

			const prioritized = prioritizeLinks(discoveredLinks, baseUrl);
			// Max 2 subpages to keep credits low (total: 3 credits max)
			const pagesToFetch = prioritized.slice(0, 2);

			const pageResults = await Promise.allSettled(
				pagesToFetch.map(async (link) => {
					try {
						const result = await firecrawl.scrape(link, {
							formats: ["markdown"],
							onlyMainContent: true,
							timeout: 10000,
						});
						return { url: link, markdown: result.markdown || "" };
					} catch {
						return null;
					}
				}),
			);

			for (const result of pageResults) {
				if (result.status === "fulfilled" && result.value) {
					const path = new URL(result.value.url).pathname;
					texts.push(`## ${path}\n\n${result.value.markdown}`);
				}
			}
		}

		const fullText = texts.join("\n\n---\n\n");
		const truncated = truncateToWords(fullText, MAX_WORDS);

		if (countWords(truncated) < MIN_USEFUL_WORDS) {
			return {
				success: false,
				url: baseUrl,
				pagesFound: 0,
				businessContext: "",
				error: "El sitio web no tiene suficiente contenido accesible",
			};
		}

		return {
			success: true,
			url: baseUrl,
			pagesFound: texts.length,
			businessContext: truncated,
		};
	} catch {
		return {
			success: false,
			url: baseUrl,
			pagesFound: 0,
			businessContext: "",
			error: "No pudimos acceder al sitio web",
		};
	}
}

// ---------------------------------------------------------------------------
// Native fetch path — HTML → Markdown via node-html-markdown
// ---------------------------------------------------------------------------

async function crawlWithFetch(baseUrl: string): Promise<CrawlResult> {
	const visited = new Set<string>();
	const texts: string[] = [];

	const homepage = await fetchAndConvert(baseUrl);
	if (!homepage) {
		return {
			success: false,
			url: baseUrl,
			pagesFound: 0,
			businessContext: "",
			error: "No pudimos acceder al sitio web",
		};
	}

	visited.add(baseUrl);
	texts.push(`## Pagina principal\n\n${homepage.markdown}`);

	// Extract and follow internal links
	const internalLinks = extractInternalLinks(
		homepage.html,
		baseUrl,
	).filter((link) => !visited.has(link));

	const prioritized = prioritizeLinks(internalLinks, baseUrl);
	const pagesToFetch = prioritized.slice(0, MAX_PAGES - 1);
	const pageResults = await Promise.allSettled(
		pagesToFetch.map((link) => fetchAndConvert(link)),
	);

	for (let i = 0; i < pageResults.length; i++) {
		const result = pageResults[i];
		if (result?.status === "fulfilled" && result.value) {
			const pagePath = new URL(pagesToFetch[i]!).pathname;
			texts.push(`## ${pagePath}\n\n${result.value.markdown}`);
			visited.add(pagesToFetch[i]!);
		}
	}

	const fullText = texts.join("\n\n---\n\n");
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

function prioritizeLinks(links: string[], _baseUrl: string): string[] {
	const scored = links
		.filter((link) => {
			try {
				const path = new URL(link).pathname.toLowerCase();
				return !SKIP_PATHS.some((skip) => path === skip || path === `${skip}/`);
			} catch {
				return false;
			}
		})
		.map((link) => {
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

function countWords(text: string): number {
	return text.split(/\s+/).filter(Boolean).length;
}

function truncateToWords(text: string, maxWords: number): string {
	const words = text.split(/\s+/);
	if (words.length <= maxWords) return text;
	return words.slice(0, maxWords).join(" ") + "...";
}

// ---------------------------------------------------------------------------
// Native fetch helpers
// ---------------------------------------------------------------------------

const USER_AGENTS = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	"Mozilla/5.0 (compatible; AuditoraBot/1.0; +https://auditora.ai)",
];

/**
 * Fetch a URL and convert its HTML to Markdown.
 * Tries multiple User-Agents if the first one gets blocked or returns sparse content.
 */
async function fetchAndConvert(
	url: string,
): Promise<{ markdown: string; html: string } | null> {
	for (const ua of USER_AGENTS) {
		const result = await fetchHtml(url, ua);
		if (!result) continue;

		const markdown = htmlToMarkdown(result.html);
		if (countWords(markdown) >= 20) {
			return { markdown, html: result.html };
		}
	}
	return null;
}

async function fetchHtml(
	url: string,
	userAgent: string,
): Promise<{ html: string } | null> {
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent": userAgent,
				Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "es,en;q=0.9",
				"Accept-Encoding": "gzip, deflate, br",
				"Cache-Control": "no-cache",
			},
			redirect: "follow",
		});

		clearTimeout(timeout);

		if (!response.ok) return null;

		const contentType = response.headers.get("content-type") || "";
		if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
			return null;
		}

		const html = await response.text();
		return html.length > 100 ? { html } : null;
	} catch {
		return null;
	}
}

/**
 * Convert raw HTML to clean Markdown using node-html-markdown.
 * Strips junk elements, preserves structure (headings, lists, links, tables).
 * Falls back to meta tags if the body is sparse (SPA with SSR meta).
 */
function htmlToMarkdown(html: string): string {
	// Extract the main content area if it exists — avoids header/sidebar noise
	const mainMatch = html.match(/<main[\s>][\s\S]*?<\/main>/i)
		|| html.match(/<article[\s>][\s\S]*?<\/article>/i)
		|| html.match(/<div[^>]+(?:role=["']main["']|id=["'](?:content|main|app)["']|class=["'][^"']*content[^"']*["'])[^>]*>[\s\S]*?<\/div>/i);

	const contentHtml = mainMatch ? mainMatch[0] : html;

	let markdown = htmlToMd.translate(contentHtml);

	// Clean up excessive blank lines
	markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

	// If body is sparse, prepend meta info (helps with SPAs that SSR meta tags)
	if (countWords(markdown) < MIN_USEFUL_WORDS) {
		const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
		const metaDesc = html.match(
			/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
		)?.[1]?.trim();
		const ogDesc = html.match(
			/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
		)?.[1]?.trim();

		const metaParts: string[] = [];
		if (title) metaParts.push(`# ${title}`);
		if (metaDesc) metaParts.push(metaDesc);
		if (ogDesc && ogDesc !== metaDesc) metaParts.push(ogDesc);

		if (metaParts.length > 0) {
			markdown = metaParts.join("\n\n") + "\n\n" + markdown;
		}
	}

	return markdown;
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
					/\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico|woff|woff2|ttf|eot|mp4|mp3|zip|tar|gz)$/i,
				)
			) {
				const normalized = `${resolved.origin}${resolved.pathname}`;
				if (!links.includes(normalized) && normalized !== baseUrl) {
					links.push(normalized);
				}
			}
		} catch {
			// Skip invalid URLs
		}
	}

	return links;
}
