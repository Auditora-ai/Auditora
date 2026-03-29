"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ELEMENT_COLORS } from "@meeting/lib/bpmn-colors";

// Demo BPMN XML for empty state — a realistic "Proceso de Compras" example
const DEMO_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="Start" name="Solicitud recibida">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Revisar requisición">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="GW_1" name="¿Aprobado?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_2" name="Solicitar cotizaciones">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_3" name="Evaluar proveedores">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_4" name="Emitir orden de compra">
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="End_1" name="Compra realizada">
      <bpmn:incoming>Flow_7</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="End_2" name="Solicitud rechazada">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="GW_1" />
    <bpmn:sequenceFlow id="Flow_3" name="Sí" sourceRef="GW_1" targetRef="Task_2" />
    <bpmn:sequenceFlow id="Flow_4" name="No" sourceRef="GW_1" targetRef="End_2" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="Task_3" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="Task_4" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_4" targetRef="End_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="Start_di" bpmnElement="Start"><dc:Bounds x="180" y="160" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1"><dc:Bounds x="270" y="138" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="GW_1_di" bpmnElement="GW_1" isMarkerVisible="true"><dc:Bounds x="425" y="153" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2_di" bpmnElement="Task_2"><dc:Bounds x="530" y="138" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_3_di" bpmnElement="Task_3"><dc:Bounds x="690" y="138" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_4_di" bpmnElement="Task_4"><dc:Bounds x="850" y="138" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_1_di" bpmnElement="End_1"><dc:Bounds x="1010" y="160" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_2_di" bpmnElement="End_2"><dc:Bounds x="432" y="280" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1"><di:waypoint x="216" y="178" /><di:waypoint x="270" y="178" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2"><di:waypoint x="370" y="178" /><di:waypoint x="425" y="178" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3"><di:waypoint x="475" y="178" /><di:waypoint x="530" y="178" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4"><di:waypoint x="450" y="203" /><di:waypoint x="450" y="280" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5"><di:waypoint x="630" y="178" /><di:waypoint x="690" y="178" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6"><di:waypoint x="790" y="178" /><di:waypoint x="850" y="178" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7"><di:waypoint x="950" y="178" /><di:waypoint x="1010" y="178" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

interface HeroBpmnViewerProps {
	bpmnXml: string | null;
	processName: string | null;
	processId: string | null;
	basePath: string;
	isDemo?: boolean;
}

export function HeroBpmnViewer({
	bpmnXml,
	processName,
	processId,
	basePath,
	isDemo = false,
}: HeroBpmnViewerProps) {
	const t = useTranslations("dashboard");
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	const xmlToRender = bpmnXml || DEMO_BPMN_XML;
	const showDemo = !bpmnXml;

	useEffect(() => {
		if (!containerRef.current || viewerRef.current) return;

		let cancelled = false;

		async function initViewer() {
			try {
				const { default: BpmnViewer } = await import("bpmn-js/lib/Viewer");
				if (cancelled || !containerRef.current) return;

				const viewer = new BpmnViewer({
					container: containerRef.current,
				});

				viewerRef.current = viewer;

				await viewer.importXML(xmlToRender);

				// Apply colors via CSS classes (Viewer doesn't have modeling API)
				const canvas = viewer.get("canvas") as any;
				canvas.zoom("fit-viewport");

				setIsLoading(false);
			} catch {
				setIsLoading(false);
			}
		}

		initViewer();
		return () => {
			cancelled = true;
			viewerRef.current?.destroy();
			viewerRef.current = null;
		};
	}, [xmlToRender]);

	const content = (
		<Card className="relative overflow-hidden border-border/50 bg-background">
			{/* Loading skeleton */}
			{isLoading && (
				<div className="absolute inset-0 z-10">
					<Skeleton className="h-full w-full rounded-xl" />
				</div>
			)}

			{/* BPMN viewer container */}
			<div ref={containerRef} className="w-full h-[320px]" />

			{/* Custom CSS for DESIGN.md colors */}
			<style jsx global>{`
				.hero-bpmn .djs-shape .djs-visual > rect { stroke: ${ELEMENT_COLORS["bpmn:Task"].stroke} !important; fill: ${ELEMENT_COLORS["bpmn:Task"].fill} !important; }
				.hero-bpmn .djs-shape[data-element-id^="Start"] .djs-visual > circle { stroke: ${ELEMENT_COLORS["bpmn:StartEvent"].stroke} !important; fill: ${ELEMENT_COLORS["bpmn:StartEvent"].fill} !important; }
				.hero-bpmn .djs-shape[data-element-id^="End"] .djs-visual > circle { stroke: ${ELEMENT_COLORS["bpmn:EndEvent"].stroke} !important; fill: ${ELEMENT_COLORS["bpmn:EndEvent"].fill} !important; }
				.hero-bpmn .djs-shape[data-element-id^="GW"] .djs-visual > polygon,
				.hero-bpmn .djs-shape[data-element-id*="Gateway"] .djs-visual > polygon { stroke: ${ELEMENT_COLORS["bpmn:ExclusiveGateway"].stroke} !important; fill: ${ELEMENT_COLORS["bpmn:ExclusiveGateway"].fill} !important; }
				.hero-bpmn .djs-connection .djs-visual > path { stroke: #64748B !important; }
				.hero-bpmn .djs-label text { fill: #0F172A !important; font-family: 'Geist', system-ui, sans-serif !important; font-size: 12px !important; }
				.hero-bpmn .bjs-powered-by { display: none !important; }
			`}</style>

			{/* Process name label */}
			{!showDemo && processName && (
				<div className="absolute bottom-3 left-4 flex items-center gap-2">
					<span className="text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md border">
						{processName}
					</span>
				</div>
			)}

			{/* Demo overlay */}
			{showDemo && !isLoading && (
				<div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-background/90 via-background/20 to-transparent">
					<div className="text-center pb-8">
						<p className="font-semibold text-base mb-1">
							{t("hero.demoTitle")}
						</p>
						<p className="text-muted-foreground text-sm max-w-[320px]">
							{t("hero.demoSubtitle")}
						</p>
					</div>
				</div>
			)}
		</Card>
	);

	// Wrap in link if we have a real process to navigate to
	if (!showDemo && processId) {
		return (
			<div className="hero-bpmn">
				<Link href={`${basePath}/procesos/${processId}`} className="block hover:opacity-95 transition-opacity">
					{content}
				</Link>
			</div>
		);
	}

	return <div className="hero-bpmn">{content}</div>;
}
