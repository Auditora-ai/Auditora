"use client";

/**
 * BpmnLegend — Color legend panel for BPMN element types
 *
 * Floating panel toggled from toolbar showing what each color means.
 * Bizagi-inspired warm palette.
 */
export function BpmnLegend({
	visible,
	onClose,
}: {
	visible: boolean;
	onClose: () => void;
}) {
	if (!visible) return null;

	const items = [
		{
			label: "Inicio",
			shape: "circle",
			stroke: "#16A34A",
			fill: "#F0FDF4",
		},
		{
			label: "Tarea",
			shape: "rect",
			stroke: "#3B82F6",
			fill: "#EFF6FF",
		},
		{
			label: "Compuerta",
			shape: "diamond",
			stroke: "#EAB308",
			fill: "#FEF9C3",
		},
		{
			label: "Evento intermedio",
			shape: "circle",
			stroke: "#A16207",
			fill: "#FEF3C7",
		},
		{
			label: "Subproceso",
			shape: "rect",
			stroke: "#7C3AED",
			fill: "#F5F3FF",
		},
		{
			label: "Fin",
			shape: "circle",
			stroke: "#DC2626",
			fill: "#FEF2F2",
		},
	];

	const states = [
		{
			label: "Formando",
			stroke: "#EAB308",
			fill: "#FEF9C3",
			dashed: true,
		},
		{ label: "Confirmado", stroke: "#3B82F6", fill: "#EFF6FF" },
		{ label: "Activo", stroke: "#2563EB", fill: "#DBEAFE", thick: true },
	];

	return (
		<div className="absolute bottom-20 right-4 z-20 w-48 rounded-lg border border-border bg-card shadow-lg">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<span className="text-xs font-semibold">Leyenda</span>
				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground text-xs"
				>
					×
				</button>
			</div>

			<div className="px-3 py-2 space-y-1.5">
				<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
					Elementos
				</p>
				{items.map((item) => (
					<div
						key={item.label}
						className="flex items-center gap-2"
					>
						<svg width="16" height="16" viewBox="0 0 16 16">
							{item.shape === "circle" && (
								<circle
									cx="8"
									cy="8"
									r="6"
									fill={item.fill}
									stroke={item.stroke}
									strokeWidth="1.5"
								/>
							)}
							{item.shape === "rect" && (
								<rect
									x="1"
									y="3"
									width="14"
									height="10"
									rx="2"
									fill={item.fill}
									stroke={item.stroke}
									strokeWidth="1.5"
								/>
							)}
							{item.shape === "diamond" && (
								<polygon
									points="8,1 15,8 8,15 1,8"
									fill={item.fill}
									stroke={item.stroke}
									strokeWidth="1.5"
								/>
							)}
						</svg>
						<span className="text-[11px]">{item.label}</span>
					</div>
				))}

				<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-3">
					Estados
				</p>
				{states.map((state) => (
					<div
						key={state.label}
						className="flex items-center gap-2"
					>
						<svg width="16" height="16" viewBox="0 0 16 16">
							<rect
								x="1"
								y="3"
								width="14"
								height="10"
								rx="2"
								fill={state.fill}
								stroke={state.stroke}
								strokeWidth={state.thick ? "2.5" : "1.5"}
								strokeDasharray={
									state.dashed ? "3,3" : undefined
								}
							/>
						</svg>
						<span className="text-[11px]">{state.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}
