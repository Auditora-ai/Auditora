"use client";

/**
 * Activity Detail Cards with Inline SOPs
 *
 * Expandable cards grouped by lane showing:
 * - Node properties (description, SLA, systems, I/O, frequency, duration, cost)
 * - Confidence indicator
 * - Expandable SOP/procedure accordion
 */

import { useState } from "react";
import { ReportSection } from "./ReportSection";

interface NodeProperties {
	description?: string;
	responsable?: string;
	slaValue?: string | number;
	slaUnit?: string;
	frequency?: string;
	systems?: string[];
	inputs?: string[];
	outputs?: string[];
	estimatedDuration?: string;
	costPerExecution?: string | number;
	[key: string]: any;
}

interface ProcedureStep {
	stepNumber: number;
	action: string;
	description?: string;
	systems?: string[];
	exceptions?: Array<{ condition: string; action: string }>;
}

interface Procedure {
	activityName?: string;
	procedureCode?: string;
	responsible?: string;
	frequency?: string;
	objective?: string;
	scope?: string;
	prerequisites?: string[];
	steps?: ProcedureStep[];
	gaps?: string[];
	overallConfidence?: number;
}

interface ActivityNode {
	id: string;
	label: string;
	nodeType: string;
	lane: string | null;
	state: string;
	confidence: number | null;
	properties: NodeProperties | null;
	procedure: Procedure | null;
}

interface ActivityCardsProps {
	nodes: ActivityNode[];
}

export function ActivityCards({ nodes }: ActivityCardsProps) {
	if (nodes.length === 0) {
		return (
			<ReportSection title="Detalle de Actividades">
				<p className="text-sm text-stone-400">No hay actividades para mostrar.</p>
			</ReportSection>
		);
	}

	// Group by lane
	const laneMap = new Map<string, ActivityNode[]>();
	for (const node of nodes) {
		const lane = node.lane || "General";
		if (!laneMap.has(lane)) laneMap.set(lane, []);
		laneMap.get(lane)!.push(node);
	}

	return (
		<ReportSection title="Detalle de Actividades">
			<p className="mb-4 text-sm text-stone-500">
				{nodes.length} actividades documentadas
				{nodes.filter((n) => n.procedure).length > 0 && (
					<> · {nodes.filter((n) => n.procedure).length} con SOP</>
				)}
			</p>
			<div className="space-y-6">
				{Array.from(laneMap.entries()).map(([lane, laneNodes]) => (
					<div key={lane}>
						<h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-blue-500" />
							{lane}
							<span className="text-xs font-normal text-stone-400">({laneNodes.length})</span>
						</h3>
						<div className="space-y-2">
							{laneNodes.map((node) => (
								<ActivityCard key={node.id} node={node} />
							))}
						</div>
					</div>
				))}
			</div>
		</ReportSection>
	);
}

function ActivityCard({ node }: { node: ActivityNode }) {
	const [expanded, setExpanded] = useState(false);
	const props = node.properties || {};
	const hasSop = !!node.procedure?.steps?.length;
	const hasProps = !!(props.description || props.slaValue || props.systems?.length || props.inputs?.length || props.outputs?.length);

	return (
		<div
			id={`node-${node.id}`}
			className="rounded-lg border border-stone-200 bg-white overflow-hidden"
		>
			{/* Card header */}
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-stone-50 transition-colors"
			>
				<div className="flex items-center gap-3 min-w-0">
					<NodeTypeBadge type={node.nodeType} />
					<div className="min-w-0">
						<span className="text-sm font-medium text-stone-800 block truncate">
							{node.label}
						</span>
						{props.description && !expanded && (
							<span className="text-xs text-stone-400 block truncate mt-0.5">
								{props.description}
							</span>
						)}
					</div>
				</div>
				<div className="flex items-center gap-3 shrink-0 ml-3">
					{node.state === "FORMING" && (
						<span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
							En formacion
						</span>
					)}
					{hasSop && (
						<span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
							SOP
						</span>
					)}
					{node.confidence != null && (
						<ConfidenceBar value={node.confidence} />
					)}
					<svg
						className={`w-4 h-4 text-stone-400 transition-transform ${expanded ? "rotate-180" : ""}`}
						fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
					</svg>
				</div>
			</button>

			{/* Expanded content */}
			{expanded && (hasProps || hasSop) && (
				<div className="border-t border-stone-100 px-4 py-4 space-y-4">
					{/* Description */}
					{props.description && (
						<p className="text-sm text-stone-600 leading-relaxed">{props.description}</p>
					)}

					{/* Property tags */}
					<div className="flex flex-wrap gap-2">
						{props.slaValue && (
							<Tag color="amber">SLA: {props.slaValue} {props.slaUnit || ""}</Tag>
						)}
						{props.frequency && (
							<Tag color="stone">Frecuencia: {props.frequency}</Tag>
						)}
						{props.estimatedDuration && (
							<Tag color="stone">Duracion: {props.estimatedDuration}</Tag>
						)}
						{props.costPerExecution && (
							<Tag color="stone">Costo: {props.costPerExecution}</Tag>
						)}
						{props.responsable && (
							<Tag color="stone">Responsable: {props.responsable}</Tag>
						)}
					</div>

					{/* Systems */}
					{props.systems && props.systems.length > 0 && (
						<div>
							<span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Sistemas</span>
							<div className="flex flex-wrap gap-1.5 mt-1">
								{props.systems.map((s, i) => (
									<Tag key={i} color="blue">{s}</Tag>
								))}
							</div>
						</div>
					)}

					{/* Inputs / Outputs */}
					<div className="grid grid-cols-2 gap-4">
						{props.inputs && props.inputs.length > 0 && (
							<div>
								<span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Entradas</span>
								<div className="flex flex-wrap gap-1.5 mt-1">
									{props.inputs.map((inp, i) => (
										<Tag key={i} color="green">↓ {inp}</Tag>
									))}
								</div>
							</div>
						)}
						{props.outputs && props.outputs.length > 0 && (
							<div>
								<span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Salidas</span>
								<div className="flex flex-wrap gap-1.5 mt-1">
									{props.outputs.map((out, i) => (
										<Tag key={i} color="green">↑ {out}</Tag>
									))}
								</div>
							</div>
						)}
					</div>

					{/* SOP Accordion */}
					{hasSop && node.procedure && (
						<SopSection procedure={node.procedure} />
					)}
				</div>
			)}
		</div>
	);
}

function SopSection({ procedure }: { procedure: Procedure }) {
	const [showSop, setShowSop] = useState(false);

	return (
		<div className="border border-blue-100 rounded-lg overflow-hidden">
			<button
				type="button"
				onClick={() => setShowSop(!showSop)}
				className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 text-left hover:bg-blue-100 transition-colors"
			>
				<span className="text-sm font-medium text-blue-800">
					Procedimiento (SOP)
					{procedure.overallConfidence != null && (
						<span className="ml-2 text-xs font-normal text-blue-600">
							Confianza: {Math.round(procedure.overallConfidence * 100)}%
						</span>
					)}
				</span>
				<svg
					className={`w-4 h-4 text-blue-500 transition-transform ${showSop ? "rotate-180" : ""}`}
					fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
				>
					<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
				</svg>
			</button>

			{showSop && (
				<div className="px-4 py-4 space-y-3">
					{/* Metadata */}
					<div className="flex flex-wrap gap-4 text-xs text-stone-500">
						{procedure.procedureCode && <span>Codigo: {procedure.procedureCode}</span>}
						{procedure.responsible && <span>Responsable: {procedure.responsible}</span>}
						{procedure.frequency && <span>Frecuencia: {procedure.frequency}</span>}
					</div>

					{procedure.objective && (
						<p className="text-sm text-stone-600">
							<strong className="text-stone-700">Objetivo:</strong> {procedure.objective}
						</p>
					)}

					{procedure.scope && (
						<p className="text-sm text-stone-600">
							<strong className="text-stone-700">Alcance:</strong> {procedure.scope}
						</p>
					)}

					{/* Prerequisites */}
					{procedure.prerequisites && procedure.prerequisites.length > 0 && (
						<div>
							<span className="text-xs font-semibold text-stone-700">Prerrequisitos</span>
							<ul className="mt-1 list-disc list-inside text-sm text-stone-600 space-y-0.5">
								{procedure.prerequisites.map((p, i) => (
									<li key={i}>{p}</li>
								))}
							</ul>
						</div>
					)}

					{/* Steps */}
					{procedure.steps && procedure.steps.length > 0 && (
						<div>
							<span className="text-xs font-semibold text-stone-700">
								Pasos ({procedure.steps.length})
							</span>
							<div className="mt-2 space-y-2">
								{procedure.steps.map((step) => (
									<div key={step.stepNumber} className="flex gap-3">
										<span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0 mt-0.5">
											{step.stepNumber}
										</span>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-stone-800">{step.action}</p>
											{step.description && (
												<p className="text-xs text-stone-500 mt-0.5">{step.description}</p>
											)}
											{step.systems && step.systems.length > 0 && (
												<div className="flex gap-1 mt-1">
													{step.systems.map((s, i) => (
														<Tag key={i} color="blue">{s}</Tag>
													))}
												</div>
											)}
											{step.exceptions && step.exceptions.length > 0 && (
												<div className="mt-1 space-y-1">
													{step.exceptions.map((ex, i) => (
														<p key={i} className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1">
															Si: {ex.condition} → {ex.action}
														</p>
													))}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Gaps */}
					{procedure.gaps && procedure.gaps.length > 0 && (
						<div>
							<span className="text-xs font-semibold text-amber-700">Informacion Pendiente</span>
							<ul className="mt-1 list-disc list-inside text-xs text-amber-700 space-y-0.5">
								{procedure.gaps.map((g, i) => (
									<li key={i}>{g}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function NodeTypeBadge({ type }: { type: string }) {
	const colors: Record<string, string> = {
		TASK: "bg-blue-100 text-blue-700",
		USER_TASK: "bg-blue-100 text-blue-700",
		USERTASK: "bg-blue-100 text-blue-700",
		START_EVENT: "bg-green-100 text-green-700",
		END_EVENT: "bg-red-100 text-red-700",
		EXCLUSIVE_GATEWAY: "bg-amber-100 text-amber-700",
		PARALLEL_GATEWAY: "bg-amber-100 text-amber-700",
		INCLUSIVE_GATEWAY: "bg-amber-100 text-amber-700",
		SUB_PROCESS: "bg-indigo-100 text-indigo-700",
	};
	const c = colors[type] || colors[type.toUpperCase()] || "bg-stone-100 text-stone-600";
	const label = type.replace(/_/g, " ").toLowerCase();
	return (
		<span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${c}`}>
			{label}
		</span>
	);
}

function ConfidenceBar({ value }: { value: number }) {
	const pct = Math.round(value * 100);
	const color = pct >= 75 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
	return (
		<div className="flex items-center gap-1.5" title={`Confianza: ${pct}%`}>
			<div className="w-10 h-1.5 rounded-full bg-stone-100 overflow-hidden">
				<div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
			</div>
			<span className="text-[10px] text-stone-400">{pct}%</span>
		</div>
	);
}

function Tag({ children, color }: { children: React.ReactNode; color: "blue" | "green" | "amber" | "stone" }) {
	const colors = {
		blue: "bg-blue-50 text-blue-700 border-blue-100",
		green: "bg-green-50 text-green-700 border-green-100",
		amber: "bg-amber-50 text-amber-700 border-amber-100",
		stone: "bg-stone-50 text-stone-600 border-stone-100",
	};
	return (
		<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${colors[color]}`}>
			{children}
		</span>
	);
}

