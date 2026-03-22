"use client";

import { useEffect, useRef, useState } from "react";

interface DiagramNode {
  id: string;
  type: "startEvent" | "endEvent" | "task" | "exclusiveGateway" | "parallelGateway";
  label: string;
  state: "forming" | "confirmed" | "rejected";
  lane?: string;
  connections: string[];
}

interface DiagramPanelProps {
  nodes: DiagramNode[];
  onConfirmNode: (nodeId: string) => void;
  onRejectNode: (nodeId: string) => void;
  sessionType: "DISCOVERY" | "DEEP_DIVE";
}

export function DiagramPanel({
  nodes,
  onConfirmNode,
  onRejectNode,
  sessionType,
}: DiagramPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bpmnModeler, setBpmnModeler] = useState<any>(null);

  // Initialize bpmn-js Modeler
  useEffect(() => {
    let modeler: any;

    async function initModeler() {
      // Dynamic import to avoid SSR issues
      const BpmnModeler = (await import("bpmn-js/lib/Modeler")).default;

      if (!containerRef.current) return;

      modeler = new BpmnModeler({
        container: containerRef.current,
        // Disable all editing tools for restricted mode
        additionalModules: [],
      });

      // Load empty diagram
      const emptyDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

      try {
        await modeler.importXML(emptyDiagram);
        setBpmnModeler(modeler);
      } catch (err) {
        console.error("Failed to init BPMN modeler:", err);
      }
    }

    initModeler();

    return () => {
      modeler?.destroy();
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {sessionType === "DISCOVERY" ? "Process Architecture" : "Live Process Diagram"}
        </span>
        {nodes.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            {nodes.filter((n) => n.state === "confirmed").length} confirmed
          </span>
        )}
      </div>

      {/* BPMN Canvas */}
      <div className="relative flex-1">
        <div
          ref={containerRef}
          className="h-full w-full"
          style={{
            backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Empty state overlay */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="font-serif text-lg text-slate-400">
                {sessionType === "DISCOVERY"
                  ? "Describe your business to begin mapping"
                  : "Describe the process to begin diagramming"
                }
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Nodes will appear as process steps are discussed
              </p>
            </div>
          </div>
        )}

        {/* Node action overlay — shows confirm/reject buttons on forming nodes */}
        {nodes
          .filter((n) => n.state === "forming")
          .map((node) => (
            <div
              key={node.id}
              className="absolute flex gap-1"
              style={{
                // Position will be calculated based on bpmn-js element position
                top: "50%",
                left: "50%",
              }}
            >
              <button
                type="button"
                onClick={() => onConfirmNode(node.id)}
                className="rounded bg-emerald-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-600 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => onRejectNode(node.id)}
                className="rounded bg-red-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
