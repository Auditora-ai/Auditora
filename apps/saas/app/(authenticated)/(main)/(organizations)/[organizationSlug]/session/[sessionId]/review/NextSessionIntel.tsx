import { ReportSection } from "./ReportSection";

interface FollowUpSuggestion {
	shouldSchedule: boolean;
	focusAreas: string[];
	estimatedDuration: string;
	unresolved: number;
}

interface NextSessionIntelProps {
	followUp: FollowUpSuggestion | null;
	gapCount: number;
	complexityExplanation?: string | null;
	complexityRecommendation?: string | null;
	contradictions?: Array<{ topic: string; claim1?: string; claim2?: string; existingClaim?: string; newClaim?: string }>;
	actions?: React.ReactNode;
}

export function NextSessionIntel({ followUp, gapCount, complexityExplanation, complexityRecommendation, contradictions, actions }: NextSessionIntelProps) {
	const hasContradictions = contradictions && contradictions.length > 0;
	const hasComplexity = complexityExplanation || complexityRecommendation;

	return (
		<ReportSection title="Recomendaciones" actions={actions}>
			<div className="space-y-5">
				{/* Complexity insight */}
				{hasComplexity && (
					<div className="space-y-2">
						{complexityExplanation && (
							<div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
								<p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Analisis de Complejidad</p>
								<p className="text-sm text-stone-700">{complexityExplanation}</p>
							</div>
						)}
						{complexityRecommendation && (
							<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
								<p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Recomendacion</p>
								<p className="text-sm text-blue-800">{complexityRecommendation}</p>
							</div>
						)}
					</div>
				)}

				{/* Contradictions */}
				{hasContradictions && (
					<div>
						<p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Contradicciones Detectadas ({contradictions!.length})</p>
						<div className="space-y-2">
							{contradictions!.map((c, i) => (
								<div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
									<p className="text-sm font-medium text-amber-900">{c.topic}</p>
									<div className="mt-1 space-y-1 text-xs text-amber-700">
										<p><span className="font-medium">Version 1:</span> {c.claim1 || c.existingClaim}</p>
										<p><span className="font-medium">Version 2:</span> {c.claim2 || c.newClaim}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Follow-up recommendation */}
				{followUp ? (
					followUp.shouldSchedule ? (
						<div className="space-y-4">
							<div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
								<svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
								</svg>
								<div>
									<p className="text-sm font-medium text-blue-800">
										Se recomienda sesion de seguimiento
									</p>
									<p className="text-xs text-blue-600 mt-0.5">
										{followUp.unresolved} tema(s) pendientes · Duracion estimada: {followUp.estimatedDuration}
									</p>
								</div>
							</div>

							{followUp.focusAreas.length > 0 && (
								<div>
									<h3 className="text-sm font-medium text-stone-700 mb-2">Temas a cubrir en proxima sesion</h3>
									<ul className="space-y-1.5">
										{followUp.focusAreas.map((area, i) => (
											<li key={i} className="flex items-start gap-2 text-sm text-stone-600">
												<span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
													{i + 1}
												</span>
												{area}
											</li>
										))}
									</ul>
								</div>
							)}

							{gapCount > 0 && (
								<p className="text-xs text-stone-400">
									Basado en {gapCount} brecha(s) de conocimiento identificadas.
								</p>
							)}
						</div>
					) : (
						<div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
							<svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div>
								<p className="text-sm font-medium text-green-800">La documentacion del proceso avanza bien</p>
								<p className="text-xs text-green-600 mt-0.5">No se requiere sesion de seguimiento urgente.</p>
							</div>
						</div>
					)
				) : !hasComplexity && !hasContradictions ? (
					<p className="text-sm text-stone-400">Recomendaciones pendientes de generacion.</p>
				) : null}
			</div>
		</ReportSection>
	);
}
