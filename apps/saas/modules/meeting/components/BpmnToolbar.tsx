"use client";

interface BpmnToolbarProps {
	canUndo: boolean;
	canRedo: boolean;
	gridEnabled: boolean;
	isFullscreen: boolean;
	hasElements: boolean;
	onUndo: () => void;
	onRedo: () => void;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onZoomFit: () => void;
	onToggleGrid: () => void;
	onExportSVG: () => void;
	onExportPNG: () => void;
	onToggleFullscreen: () => void;
	onShowShortcuts: () => void;
}

/**
 * BpmnToolbar — Professional dark chrome toolbar
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ [Edit: ⟲ ⟳ 🗑] │ [View: 🔍+ 🔍- ⊞ ⊟] │ [Align] │ [↓SVG ↓PNG] │ [⛶] │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Element creation is handled by bpmn-js's built-in palette (left sidebar).
 * This toolbar provides edit, view, and export actions.
 */
export function BpmnToolbar({
	canUndo,
	canRedo,
	gridEnabled,
	isFullscreen,
	hasElements,
	onUndo,
	onRedo,
	onZoomIn,
	onZoomOut,
	onZoomFit,
	onToggleGrid,
	onExportSVG,
	onExportPNG,
	onToggleFullscreen,
	onShowShortcuts,
}: BpmnToolbarProps) {
	return (
		<div className="flex h-11 items-center gap-0.5 border-b border-[#334155] bg-[#0F172A] px-2">
			{/* Edit section */}
			<ToolbarSection>
				<ToolbarButton
					onClick={onUndo}
					disabled={!canUndo}
					title="Undo (Ctrl+Z)"
					aria-label="Undo"
				>
					<UndoIcon />
				</ToolbarButton>
				<ToolbarButton
					onClick={onRedo}
					disabled={!canRedo}
					title="Redo (Ctrl+Y)"
					aria-label="Redo"
				>
					<RedoIcon />
				</ToolbarButton>
			</ToolbarSection>

			<ToolbarDivider />

			{/* View section */}
			<ToolbarSection>
				<ToolbarButton onClick={onZoomIn} title="Zoom in (+)" aria-label="Zoom in">
					<ZoomInIcon />
				</ToolbarButton>
				<ToolbarButton onClick={onZoomOut} title="Zoom out (-)" aria-label="Zoom out">
					<ZoomOutIcon />
				</ToolbarButton>
				<ToolbarButton onClick={onZoomFit} title="Fit to viewport" aria-label="Fit to viewport">
					<FitIcon />
				</ToolbarButton>
				<ToolbarButton
					onClick={onToggleGrid}
					title="Toggle grid"
					aria-label="Toggle grid"
					active={gridEnabled}
				>
					<GridIcon />
				</ToolbarButton>
			</ToolbarSection>

			<ToolbarDivider />

			{/* Export section */}
			<ToolbarSection>
				<ToolbarButton
					onClick={onExportSVG}
					disabled={!hasElements}
					title="Export SVG"
					aria-label="Export SVG"
				>
					<span className="text-[10px] font-medium">SVG</span>
				</ToolbarButton>
				<ToolbarButton
					onClick={onExportPNG}
					disabled={!hasElements}
					title="Export PNG"
					aria-label="Export PNG"
				>
					<span className="text-[10px] font-medium">PNG</span>
				</ToolbarButton>
			</ToolbarSection>

			{/* Right-aligned actions */}
			<div className="ml-auto flex items-center gap-0.5">
				<ToolbarButton
					onClick={onShowShortcuts}
					title="Keyboard shortcuts (?)"
					aria-label="Keyboard shortcuts"
				>
					<span className="text-[10px] font-medium">?</span>
				</ToolbarButton>
				<ToolbarButton
					onClick={onToggleFullscreen}
					title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen (F)"}
					aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
					active={isFullscreen}
				>
					<FullscreenIcon expanded={isFullscreen} />
				</ToolbarButton>
			</div>
		</div>
	);
}

function ToolbarSection({ children }: { children: React.ReactNode }) {
	return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarDivider() {
	return <div className="mx-1 h-5 w-px bg-[#334155]" />;
}

function ToolbarButton({
	children,
	onClick,
	disabled = false,
	title,
	active = false,
	"aria-label": ariaLabel,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	title: string;
	active?: boolean;
	"aria-label": string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			aria-label={ariaLabel}
			className={`flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm transition-colors ${
				active
					? "bg-[#2563EB] text-white"
					: disabled
						? "cursor-not-allowed text-[#64748B]"
						: "text-[#F1F5F9] hover:bg-[#334155]"
			}`}
		>
			{children}
		</button>
	);
}

// SVG Icons — minimal, 16x16
function UndoIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M3 7h6a4 4 0 010 8H7" />
			<path d="M6 4L3 7l3 3" />
		</svg>
	);
}

function RedoIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M13 7H7a4 4 0 000 8h2" />
			<path d="M10 4l3 3-3 3" />
		</svg>
	);
}

function ZoomInIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
			<circle cx="7" cy="7" r="4.5" />
			<path d="M10.5 10.5L14 14M5 7h4M7 5v4" />
		</svg>
	);
}

function ZoomOutIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
			<circle cx="7" cy="7" r="4.5" />
			<path d="M10.5 10.5L14 14M5 7h4" />
		</svg>
	);
}

function FitIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
		</svg>
	);
}

function GridIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
			<path d="M2 2h12v12H2zM2 6h12M2 10h12M6 2v12M10 2v12" />
		</svg>
	);
}

function FullscreenIcon({ expanded }: { expanded: boolean }) {
	if (expanded) {
		return (
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
				<path d="M4 2v2H2M12 2v2h2M4 14v-2H2M12 14v-2h2" />
			</svg>
		);
	}
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" />
		</svg>
	);
}
