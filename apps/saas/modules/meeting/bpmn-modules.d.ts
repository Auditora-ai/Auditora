declare module "diagram-js-minimap";
declare module "bpmn-js-properties-panel";
declare module "bpmn-auto-layout" {
	export function layoutProcess(xml: string): Promise<string>;
}
