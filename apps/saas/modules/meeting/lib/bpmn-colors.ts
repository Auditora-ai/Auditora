/**
 * BPMN Colors — Bizagi-inspired type-based element coloring
 *
 * Uses the OFFICIAL bpmn-js Modeling.setColor() API (not custom renderer).
 * This is safe — it doesn't interfere with the modeler's hit layer or rendering pipeline.
 * Colors are applied AFTER importXML, not during rendering.
 *
 * Reference: https://github.com/bpmn-io/bpmn-js-examples/tree/main/colors
 *
 * Color palette:
 *   - Start Events: green (#16A34A border, #F0FDF4 fill)
 *   - Tasks: soft blue (#3B82F6 border, #ECFDF5 fill)
 *   - Gateways: yellow (#EAB308 border, #FEF9C3 fill)
 *   - Intermediate Events: warm brown (#A16207 border, #FEF3C7 fill)
 *   - End Events: red (#DC2626 border, #FEF2F2 fill)
 *   - SubProcesses: purple (#7C3AED border, #F5F3FF fill)
 */

export const ELEMENT_COLORS: Record<string, { stroke: string; fill: string }> = {
	// Tasks — soft blue
	"bpmn:Task": { stroke: "#3B82F6", fill: "#ECFDF5" },
	"bpmn:UserTask": { stroke: "#3B82F6", fill: "#ECFDF5" },
	"bpmn:ServiceTask": { stroke: "#3B82F6", fill: "#ECFDF5" },
	"bpmn:SendTask": { stroke: "#3B82F6", fill: "#ECFDF5" },
	"bpmn:ReceiveTask": { stroke: "#3B82F6", fill: "#ECFDF5" },
	"bpmn:ManualTask": { stroke: "#3B82F6", fill: "#ECFDF5" },
	"bpmn:BusinessRuleTask": { stroke: "#3B82F6", fill: "#ECFDF5" },
	"bpmn:ScriptTask": { stroke: "#3B82F6", fill: "#ECFDF5" },
	// SubProcesses — purple
	"bpmn:SubProcess": { stroke: "#7C3AED", fill: "#F5F3FF" },
	// Gateways — yellow
	"bpmn:ExclusiveGateway": { stroke: "#EAB308", fill: "#FEF9C3" },
	"bpmn:ParallelGateway": { stroke: "#7C3AED", fill: "#F5F3FF" },
	"bpmn:InclusiveGateway": { stroke: "#EAB308", fill: "#FEF9C3" },
	"bpmn:EventBasedGateway": { stroke: "#EAB308", fill: "#FEF9C3" },
	// Events — green start, red end, warm brown intermediate
	"bpmn:StartEvent": { stroke: "#16A34A", fill: "#F0FDF4" },
	"bpmn:EndEvent": { stroke: "#DC2626", fill: "#FEF2F2" },
	"bpmn:IntermediateThrowEvent": { stroke: "#A16207", fill: "#FEF3C7" },
	"bpmn:IntermediateCatchEvent": { stroke: "#A16207", fill: "#FEF3C7" },
	"bpmn:BoundaryEvent": { stroke: "#A16207", fill: "#FEF3C7" },
};

/**
 * Apply Bizagi-inspired colors to all elements in the diagram.
 * Call this AFTER modeler.importXML() completes.
 *
 * Uses modeling.setColor() — the official bpmn-js API.
 * Colors persist in the BPMN XML when saved.
 *
 * @param modeler - bpmn-js Modeler instance
 */
/**
 * Apply Bizagi colors to all existing elements AND listen for new ones.
 * Call once after modeler.importXML(). Returns a cleanup function.
 */
export function applyBizagiColors(modeler: any): () => void {
	try {
		const modeling = modeler.get("modeling");
		const elementRegistry = modeler.get("elementRegistry");
		const eventBus = modeler.get("eventBus");

		// Color all existing elements
		const colorGroups = new Map<string, any[]>();
		elementRegistry.forEach((element: any) => {
			const colors = ELEMENT_COLORS[element.type];
			if (!colors) return;
			const key = `${colors.stroke}|${colors.fill}`;
			const group = colorGroups.get(key) || [];
			group.push(element);
			colorGroups.set(key, group);
		});
		for (const [key, elements] of colorGroups) {
			const [stroke, fill] = key.split("|");
			modeling.setColor(elements, { stroke, fill });
		}

		// Auto-color new elements when they're added (drag from palette, etc.)
		const onShapeAdded = (event: any) => {
			const { element } = event;
			const colors = ELEMENT_COLORS[element.type];
			if (!colors) return;
			// Defer to next tick so the element is fully rendered
			setTimeout(() => {
				try {
					modeling.setColor([element], { stroke: colors.stroke, fill: colors.fill });
				} catch {
					// element may have been removed
				}
			}, 0);
		};

		eventBus.on("shape.added", onShapeAdded);

		// Return cleanup
		return () => {
			eventBus.off("shape.added", onShapeAdded);
		};
	} catch (err) {
		console.warn("[bpmn-colors] Failed to apply colors:", err);
		return () => {};
	}
}
