/**
 * BPMN Export Utilities
 *
 * - exportSVG: Direct SVG string from bpmn-js modeler.saveSVG()
 * - exportPNG: Rasterize SVG to PNG at 2x resolution with inlined fonts
 *
 * PNG export inlines Google Fonts as base64 @font-face to ensure
 * correct rendering in Canvas.toBlob().
 */

const MAX_PNG_SIZE = 4096;

// Cache font data after first fetch
let fontCache: string | null = null;

export async function exportSVG(modeler: any): Promise<void> {
	const { svg } = await modeler.saveSVG();
	const blob = new Blob([svg], { type: "image/svg+xml" });
	downloadBlob(blob, "process-diagram.svg");
}

export async function exportPNG(modeler: any): Promise<void> {
	const { svg } = await modeler.saveSVG();

	// Parse SVG to get dimensions
	const parser = new DOMParser();
	const doc = parser.parseFromString(svg, "image/svg+xml");
	const svgEl = doc.querySelector("svg");
	if (!svgEl) throw new Error("Invalid SVG output");

	const viewBox = svgEl.getAttribute("viewBox")?.split(" ").map(Number);
	const width = viewBox ? viewBox[2] : Number.parseInt(svgEl.getAttribute("width") || "800");
	const height = viewBox ? viewBox[3] : Number.parseInt(svgEl.getAttribute("height") || "600");

	// Add padding
	const padding = 40;
	const totalWidth = width + padding * 2;
	const totalHeight = height + padding * 2;

	// Check size limit
	const scale = 2;
	if (totalWidth * scale > MAX_PNG_SIZE || totalHeight * scale > MAX_PNG_SIZE) {
		const maxDim = Math.max(totalWidth, totalHeight) * scale;
		console.warn(
			`[bpmn-export] Diagram is ${maxDim}px at 2x. Capping at ${MAX_PNG_SIZE}px.`,
		);
	}

	const canvasWidth = Math.min(totalWidth * scale, MAX_PNG_SIZE);
	const canvasHeight = Math.min(totalHeight * scale, MAX_PNG_SIZE);

	// Modify SVG DOM directly (avoids regex breakage)
	const fontStyle = await getFontStyle();
	const styleEl = doc.createElementNS("http://www.w3.org/2000/svg", "style");
	styleEl.textContent = fontStyle;
	let defsEl = svgEl.querySelector("defs");
	if (!defsEl) {
		defsEl = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
		svgEl.prepend(defsEl);
	}
	defsEl.appendChild(styleEl);

	// Add white background rect as first child after defs
	const bgRect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
	bgRect.setAttribute("x", String((viewBox?.[0] ?? 0) - padding));
	bgRect.setAttribute("y", String((viewBox?.[1] ?? 0) - padding));
	bgRect.setAttribute("width", String(totalWidth));
	bgRect.setAttribute("height", String(totalHeight));
	bgRect.setAttribute("fill", "white");
	svgEl.insertBefore(bgRect, defsEl.nextSibling);

	// Update viewBox and dimensions to include padding
	svgEl.setAttribute("viewBox", `${(viewBox?.[0] ?? 0) - padding} ${(viewBox?.[1] ?? 0) - padding} ${totalWidth} ${totalHeight}`);
	svgEl.setAttribute("width", String(canvasWidth));
	svgEl.setAttribute("height", String(canvasHeight));
	// Ensure xmlns is present (required for blob URL loading in <img>)
	svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
	svgEl.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

	const serializer = new XMLSerializer();
	const finalSvg = serializer.serializeToString(svgEl);

	// Rasterize to canvas
	const canvas = document.createElement("canvas");
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D context unavailable");

	const img = new Image();
	img.crossOrigin = "anonymous";
	const blob = new Blob([finalSvg], { type: "image/svg+xml;charset=utf-8" });
	const url = URL.createObjectURL(blob);

	return new Promise((resolve, reject) => {
		img.onload = () => {
			ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
			URL.revokeObjectURL(url);

			canvas.toBlob(
				(pngBlob) => {
					if (pngBlob) {
						downloadBlob(pngBlob, "process-diagram.png");
						resolve();
					} else {
						reject(new Error("Failed to create PNG blob"));
					}
				},
				"image/png",
				1.0,
			);
		};
		img.onerror = (e) => {
			URL.revokeObjectURL(url);
			console.error("[bpmn-export] SVG load failed. SVG length:", finalSvg.length, "First 200 chars:", finalSvg.substring(0, 200));
			reject(new Error("Failed to load SVG for rasterization"));
		};
		img.src = url;
	});
}

async function getFontStyle(): Promise<string> {
	if (fontCache) return fontCache;

	// Try to fetch Geist font CSS - fallback to system fonts if unavailable
	try {
		const response = await fetch(
			"https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap",
			{ headers: { Accept: "text/css" } },
		);
		if (response.ok) {
			fontCache = await response.text();
			return fontCache;
		}
	} catch {
		// Font fetch failed — use system fallback
	}

	fontCache = `
		* { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
	`;
	return fontCache;
}

export async function exportXML(modeler: any): Promise<void> {
	const { xml } = await modeler.saveXML({ format: true });
	const blob = new Blob([xml], { type: "application/xml" });
	downloadBlob(blob, "process-diagram.bpmn");
}

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
