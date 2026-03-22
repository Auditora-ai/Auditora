/**
 * Custom BPMN Renderer — Type-based element coloring
 *
 * Extends the default BpmnRenderer with higher priority to override
 * element colors per BPMN type:
 *   - Tasks: blue (#2563EB border, #EFF6FF fill)
 *   - Exclusive Gateways: amber (#D97706 border, #FFFBEB fill)
 *   - Parallel Gateways: purple (#7C3AED border, #F5F3FF fill)
 *   - Start Events: green (#16A34A border, #F0FDF4 fill)
 *   - End Events: red (#DC2626 border, #FEF2F2 fill)
 *   - Connections: slate (#64748B)
 *
 * State-based coloring (forming/confirmed/active) is handled via
 * CSS markers in bpmn-editor.css, which override these defaults.
 */

const ELEMENT_COLORS: Record<string, { stroke: string; fill: string }> = {
	"bpmn:Task": { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:UserTask": { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:ServiceTask": { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:SendTask": { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:ReceiveTask": { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:ManualTask": { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:BusinessRuleTask": { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:ScriptTask": { stroke: "#2563EB", fill: "#EFF6FF" },
	"bpmn:SubProcess": { stroke: "#7C3AED", fill: "#F5F3FF" },
	"bpmn:ExclusiveGateway": { stroke: "#D97706", fill: "#FFFBEB" },
	"bpmn:ParallelGateway": { stroke: "#7C3AED", fill: "#F5F3FF" },
	"bpmn:InclusiveGateway": { stroke: "#D97706", fill: "#FFFBEB" },
	"bpmn:EventBasedGateway": { stroke: "#D97706", fill: "#FFFBEB" },
	"bpmn:StartEvent": { stroke: "#16A34A", fill: "#F0FDF4" },
	"bpmn:EndEvent": { stroke: "#DC2626", fill: "#FEF2F2" },
	"bpmn:IntermediateThrowEvent": { stroke: "#0EA5E9", fill: "#F0F9FF" },
	"bpmn:IntermediateCatchEvent": { stroke: "#0EA5E9", fill: "#F0F9FF" },
	"bpmn:BoundaryEvent": { stroke: "#D97706", fill: "#FFFBEB" },
};

const CONNECTION_COLOR = "#64748B";

/**
 * Creates a bpmn-js additional module that provides custom element rendering.
 * Register this when creating the Modeler:
 *   new BpmnModeler({ additionalModules: [CustomColorRenderer] })
 */
function CustomColorRenderer(eventBus: any, bpmnRenderer: any) {
	// Listen for shape rendering events with higher priority than default (1000)
	eventBus.on("render.shape", 1100, (event: any) => {
		const { element, gfx } = event;
		const type = element.type;

		const colors = ELEMENT_COLORS[type];
		if (!colors) return;

		// Apply colors to the SVG visual elements
		const visual = gfx.querySelector(
			".djs-visual rect, .djs-visual polygon, .djs-visual circle, .djs-visual ellipse",
		);
		if (visual) {
			visual.setAttribute("stroke", colors.stroke);
			visual.setAttribute("stroke-width", "2");
			visual.setAttribute("fill", colors.fill);
		}
	});

	// Color connections
	eventBus.on("render.connection", 1100, (event: any) => {
		const { gfx } = event;
		const path = gfx.querySelector(".djs-visual path");
		if (path) {
			path.setAttribute("stroke", CONNECTION_COLOR);
			path.setAttribute("stroke-width", "1.5");
		}
		// Arrow marker
		const marker = gfx.querySelector("marker path");
		if (marker) {
			marker.setAttribute("fill", CONNECTION_COLOR);
		}
	});
}

(CustomColorRenderer as any).$inject = ["eventBus", "bpmnRenderer"];

export const CustomColorModule = {
	__init__: ["customColorRenderer"],
	customColorRenderer: ["type", CustomColorRenderer],
};
