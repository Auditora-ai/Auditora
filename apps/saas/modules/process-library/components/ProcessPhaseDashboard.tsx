"use client";

import { useState, useMemo } from "react";
import {
	VideoIcon,
	BarChart3Icon,
	SearchIcon,
	ClipboardListIcon,
	ChevronUpIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { PhaseCard, type PhaseConfig } from "./PhaseCard";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProcessSession {
	id: string;
	type: string;
	status: string;
	createdAt: string;
	endedAt: string | null;
	_count: { diagramNodes: number };
}

interface ProcessChild {
	id: string;
	name: string;
	level: string;
	processStatus: string;
	description: string | null;
}

export interface DashboardProcessData {
	id: string;
	name: string;
	description: string | null;
	goals: string[];
	triggers: string[];
	outputs: string[];
	bpmnXml: string | null;
	sessionsCount: number;
	versionsCount: number;
	raciCount: number;
	risksCount: number;
	hasIntelligence: boolean;
	conflictsCount: number;
	sessions?: ProcessSession[];
	children?: ProcessChild[];
}

interface ProcessPhaseDashboardProps {
	process: DashboardProcessData;
	organizationSlug: string;
	onExpandPhase: (phase: string | null) => void;
	expandedPhase: string | null;
}

// ─── Phase Completeness Calculation ─────────────────────────────────────────

export interface PhaseScores {
	contexto: number;
	captura: number;
	modelo: number;
	analisis: number;
}

export function calculatePhaseCompleteness(
	process: DashboardProcessData,
): PhaseScores {
	// Contexto: description + children + goals/triggers/outputs (each ~33%)
	const hasGoalsTriggersOutputs =
		(process.goals?.length ?? 0) > 0 ||
		(process.triggers?.length ?? 0) > 0 ||
		(process.outputs?.length ?? 0) > 0;
	const contexto =
		(process.description ? 33 : 0) +
		((process.children?.length ?? 0) > 0 ? 34 : 0) +
		(hasGoalsTriggersOutputs ? 33 : 0);

	// Captura: has at least one session
	const captura = process.sessionsCount > 0 ? 100 : 0;

	// Modelo: has valid diagram
	const modelo = process.bpmnXml ? 100 : 0;

	// Análisis: RACI + Intelligence + Risks (each ~33%)
	const analisis =
		(process.raciCount > 0 ? 33 : 0) +
		(process.hasIntelligence ? 34 : 0) +
		(process.risksCount > 0 ? 33 : 0);

	return { contexto, captura, modelo, analisis };
}

export function calculateOverallHealth(scores: PhaseScores): number {
	return Math.round(
		(scores.contexto + scores.captura + scores.modelo + scores.analisis) / 4,
	);
}

function detectCurrentPhase(scores: PhaseScores): string {
	if (scores.contexto < 100) return "contexto";
	if (scores.captura < 100) return "captura";
	if (scores.modelo < 100) return "modelo";
	if (scores.analisis < 100) return "analisis";
	return ""; // all complete
}

// ─── Preview & CTA Logic ────────────────────────────────────────────────────

function getCapturaPreview(process: DashboardProcessData): string {
	if (process.sessionsCount === 0) return "Sin sesiones de captura";
	const ended =
		process.sessions?.filter((s) => s.status === "ENDED").length ?? 0;
	const active =
		process.sessions?.filter(
			(s) => s.status === "ACTIVE" || s.status === "CONNECTING",
		).length ?? 0;
	const parts: string[] = [];
	parts.push(`${process.sessionsCount} sesion${process.sessionsCount !== 1 ? "es" : ""}`);
	if (active > 0) parts.push(`${active} activa${active !== 1 ? "s" : ""}`);
	if (ended > 0) {
		const lastEnded = process.sessions?.find((s) => s.status === "ENDED");
		if (lastEnded) {
			const daysAgo = Math.round(
				(Date.now() - new Date(lastEnded.createdAt).getTime()) /
					(1000 * 60 * 60 * 24),
			);
			parts.push(
				daysAgo === 0
					? "última: hoy"
					: daysAgo === 1
						? "última: ayer"
						: `última: hace ${daysAgo}d`,
			);
		}
	}
	return parts.join(" · ");
}

function getModeloPreview(process: DashboardProcessData): string {
	if (!process.bpmnXml) return "Sin diagrama BPMN";
	const parts = ["Diagrama ✓"];
	if (process.versionsCount > 0)
		parts.push(`${process.versionsCount} version${process.versionsCount !== 1 ? "es" : ""}`);
	return parts.join(" · ");
}

function getAnalisisPreview(process: DashboardProcessData): string {
	if (
		process.raciCount === 0 &&
		!process.hasIntelligence &&
		process.risksCount === 0
	)
		return "Sin análisis generado";
	const parts: string[] = [];
	parts.push(process.raciCount > 0 ? "RACI ✓" : "RACI ✗");
	parts.push(process.hasIntelligence ? "Intel ✓" : "Intel ✗");
	parts.push(process.risksCount > 0 ? "Riesgos ✓" : "Riesgos ✗");
	return parts.join(" | ");
}

function getContextoPreview(process: DashboardProcessData): string {
	const parts: string[] = [];
	if (process.description) parts.push("Desc ✓");
	const childCount = process.children?.length ?? 0;
	if (childCount > 0)
		parts.push(`${childCount} sub-proceso${childCount !== 1 ? "s" : ""}`);
	const goalsCount =
		(process.goals?.length ?? 0) +
		(process.triggers?.length ?? 0) +
		(process.outputs?.length ?? 0);
	if (goalsCount > 0) parts.push(`${goalsCount} objetivo${goalsCount !== 1 ? "s" : ""}/triggers`);
	if (parts.length === 0) return "Sin contexto definido";
	return parts.join(" · ");
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProcessPhaseDashboard({
	process,
	organizationSlug,
	onExpandPhase,
	expandedPhase,
}: ProcessPhaseDashboardProps) {
	const scores = useMemo(
		() => calculatePhaseCompleteness(process),
		[process],
	);
	const currentPhase = useMemo(() => detectCurrentPhase(scores), [scores]);

	const lastSession = process.sessions?.[0];
	const hasActiveSession =
		lastSession?.status === "ACTIVE" ||
		lastSession?.status === "CONNECTING";

	const phases: PhaseConfig[] = useMemo(
		() => [
			{
				key: "contexto",
				label: "Contexto",
				icon: ClipboardListIcon,
				completeness: scores.contexto,
				preview: getContextoPreview(process),
				isCurrentPhase: currentPhase === "contexto",
				cta: scores.contexto === 0
					? {
							label: "Define el contexto del proceso",
							onClick: () => onExpandPhase("contexto"),
						}
					: scores.contexto < 100
						? {
								label: "Completar contexto",
								onClick: () => onExpandPhase("contexto"),
							}
						: {
								label: "Ver contexto",
								onClick: () => onExpandPhase("contexto"),
							},
			},
			{
				key: "captura",
				label: "Captura",
				icon: VideoIcon,
				completeness: scores.captura,
				preview: getCapturaPreview(process),
				isCurrentPhase: currentPhase === "captura",
				cta:
					process.sessionsCount === 0
						? {
								label: "Inicia tu primer Deep Dive",
								onClick: () => {
									window.location.href = `/${organizationSlug}/sessions/new?processId=${process.id}&type=DEEP_DIVE`;
								},
							}
						: hasActiveSession && lastSession
							? {
									label: "Unirse a sesión activa",
									onClick: () => {
										window.location.href = `/${organizationSlug}/session/${lastSession.id}/live`;
									},
								}
							: lastSession?.status === "ENDED"
								? {
										label: "Continuar última sesión",
										onClick: () => {
											window.location.href = `/${organizationSlug}/sessions/new?processId=${process.id}&type=DEEP_DIVE&continuationOf=${lastSession.id}`;
										},
									}
								: null,
			},
			{
				key: "modelo",
				label: "Modelo",
				icon: BarChart3Icon,
				completeness: scores.modelo,
				preview: getModeloPreview(process),
				isCurrentPhase: currentPhase === "modelo",
				cta: process.bpmnXml
					? {
							label: "Editar diagrama",
							onClick: () => onExpandPhase("modelo"),
						}
					: process.sessionsCount > 0
						? {
								label: "Ver diagrama",
								onClick: () => onExpandPhase("modelo"),
							}
						: {
								label: "Ejecuta una sesión primero",
								onClick: () => onExpandPhase("captura"),
							},
			},
			{
				key: "analisis",
				label: "Análisis",
				icon: SearchIcon,
				completeness: scores.analisis,
				preview: getAnalisisPreview(process),
				isCurrentPhase: currentPhase === "analisis",
				cta:
					process.raciCount === 0
						? {
								label: "Genera la matriz RACI",
								onClick: () => onExpandPhase("analisis"),
							}
						: !process.hasIntelligence
							? {
									label: "Analizar proceso",
									onClick: () => onExpandPhase("analisis"),
								}
							: process.risksCount === 0
								? {
										label: "Analizar riesgos",
										onClick: () => onExpandPhase("analisis"),
									}
								: {
										label: "Ver análisis completo",
										onClick: () => onExpandPhase("analisis"),
									},
			},
		],
		[scores, currentPhase, process, organizationSlug, lastSession, hasActiveSession, onExpandPhase],
	);

	return (
		<div className="space-y-4">
			{/* 2x2 Phase Cards Grid */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{phases.map((phase) => (
					<PhaseCard
						key={phase.key}
						phase={phase}
						isExpanded={expandedPhase === phase.key}
						onClick={() =>
							onExpandPhase(
								expandedPhase === phase.key ? null : phase.key,
							)
						}
					/>
				))}
			</div>

			{/* Collapse button when a phase is expanded */}
			{expandedPhase && (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onExpandPhase(null)}
						className="text-xs text-muted-foreground"
					>
						<ChevronUpIcon className="mr-1 h-3.5 w-3.5" />
						Cerrar
					</Button>
				</div>
			)}
		</div>
	);
}
