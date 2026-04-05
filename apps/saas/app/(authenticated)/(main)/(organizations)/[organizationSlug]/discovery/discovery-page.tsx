"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
	ArrowRightIcon,
	BuildingIcon,
	FileTextIcon,
	MessageSquareIcon,
	SparklesIcon,
	UploadIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";

interface ValueChainItem {
	id: string;
	name: string;
	type: string;
	description: string | null;
}

interface ProcessSummary {
	id: string;
	name: string;
	category: string;
	status: string;
}

interface DiscoveryPageProps {
	basePath: string;
	organizationSlug: string;
	organizationName: string;
	hasDiscovery: boolean;
	industry: string | null;
	companySize: string | null;
	mission: string | null;
	valueChain: ValueChainItem[];
	processes: ProcessSummary[];
	processCount: number;
}

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Borrador",
	MAPPED: "Capturado",
	CAPTURED: "Capturado",
	VALIDATED: "Documentado",
	DOCUMENTED: "Documentado",
	APPROVED: "Evaluado",
	EVALUATED: "Evaluado",
};

function NoDiscoveryState({ basePath }: { basePath: string }) {
	return (
		<div className="pb-24 md:pb-0">
			{/* Hero */}
			<div className="text-center py-8 md:py-12">
				<div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
					<BuildingIcon className="size-8 text-primary" />
				</div>
				<h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">
					Discovery Organizacional
				</h1>
				<p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
					Antes de capturar procesos, necesitamos entender tu empresa. La IA actuará como
					consultor BPM y mapeará tu cadena de valor y procesos críticos.
				</p>
				<Button asChild size="lg" className="min-h-[48px]">
					<Link href={`${basePath}/capture/new`}>
						<SparklesIcon className="size-4 mr-2" />
						Iniciar Discovery con IA
					</Link>
				</Button>
			</div>

			{/* What you'll get */}
			<div className="mt-4">
				<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
					Qué obtendrás
				</h2>
				<div className="grid gap-3 md:grid-cols-3">
					{[
						{
							title: "Cadena de Valor",
							description: "Actividades primarias y de soporte de tu empresa (modelo Porter)",
						},
						{
							title: "Arquitectura de Procesos",
							description: "Procesos estratégicos, operativos y de soporte — priorizados",
						},
						{
							title: "Mapa de Riesgos Inicial",
							description: "Identificación de procesos críticos donde enfocar esfuerzos",
						},
					].map((item) => (
						<Card key={item.title}>
							<CardContent className="p-4">
								<p className="text-sm font-medium text-foreground">{item.title}</p>
								<p className="text-xs text-muted-foreground mt-1">{item.description}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}

export function DiscoveryPage(props: DiscoveryPageProps) {
	const {
		basePath,
		organizationName,
		hasDiscovery,
		industry,
		companySize,
		mission,
		valueChain,
		processes,
		processCount,
	} = props;

	if (!hasDiscovery) {
		return <NoDiscoveryState basePath={basePath} />;
	}

	const primaryActivities = valueChain.filter((v) => v.type === "PRIMARY");
	const supportActivities = valueChain.filter((v) => v.type === "SUPPORT");
	const draftProcesses = processes.filter((p) => p.status === "DRAFT");
	const capturedProcesses = processes.filter((p) => p.status !== "DRAFT");

	return (
		<div className="pb-24 md:pb-0 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-lg md:text-2xl font-bold text-foreground">
					{organizationName}
				</h1>
				<div className="flex items-center gap-2 mt-1">
					{industry && (
						<Badge variant="outline" className="text-[10px]">
							{industry}
						</Badge>
					)}
					{companySize && (
						<Badge variant="secondary" className="text-[10px]">
							{companySize}
						</Badge>
					)}
					<Badge variant="default" className="text-[10px]">
						{processCount} procesos
					</Badge>
				</div>
				{mission && (
					<p className="text-sm text-muted-foreground mt-2 line-clamp-2">{mission}</p>
				)}
			</div>

			{/* Value Chain */}
			{valueChain.length > 0 && (
				<div>
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
						Cadena de Valor
					</h2>
					{primaryActivities.length > 0 && (
						<div className="mb-3">
							<p className="text-[10px] text-muted-foreground mb-1.5">Primarias</p>
							<div className="flex flex-wrap gap-2">
								{primaryActivities.map((a) => (
									<Badge key={a.id} variant="default" className="text-xs">
										{a.name}
									</Badge>
								))}
							</div>
						</div>
					)}
					{supportActivities.length > 0 && (
						<div>
							<p className="text-[10px] text-muted-foreground mb-1.5">Soporte</p>
							<div className="flex flex-wrap gap-2">
								{supportActivities.map((a) => (
									<Badge key={a.id} variant="secondary" className="text-xs">
										{a.name}
									</Badge>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Processes pending capture */}
			{draftProcesses.length > 0 && (
				<div>
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
						Procesos por capturar ({draftProcesses.length})
					</h2>
					<div className="space-y-2">
						{draftProcesses.map((p) => (
							<Card key={p.id} className="active:scale-[0.98] transition-transform">
								<Link href={`${basePath}/capture/${p.id}`}>
									<CardContent className="p-4 flex items-center justify-between">
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-foreground truncate">
												{p.name}
											</p>
											<p className="text-[10px] text-muted-foreground capitalize">
												{p.category === "strategic" ? "Estratégico" : p.category === "support" ? "Soporte" : "Operativo"}
											</p>
										</div>
										<Button variant="outline" size="sm" className="shrink-0 min-h-[36px]">
											<MessageSquareIcon className="size-3.5 mr-1" />
											Capturar
										</Button>
									</CardContent>
								</Link>
							</Card>
						))}
					</div>
				</div>
			)}

			{/* Capture methods */}
			<div>
				<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
					Métodos de captura
				</h2>
				<div className="grid gap-3 md:grid-cols-3">
					<Link href={`${basePath}/capture/new`}>
						<Card className="h-full active:scale-[0.98] transition-transform hover:border-primary/40">
							<CardContent className="p-4">
								<div className="flex items-center gap-3 mb-2">
									<div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
										<MessageSquareIcon className="size-4 text-primary" />
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">Entrevista SIPOC</p>
										<p className="text-[10px] text-muted-foreground">Chat con IA</p>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									La IA entrevista al process owner paso a paso
								</p>
							</CardContent>
						</Card>
					</Link>
					<Link href={`${basePath}/capture/new`}>
						<Card className="h-full active:scale-[0.98] transition-transform hover:border-primary/40">
							<CardContent className="p-4">
								<div className="flex items-center gap-3 mb-2">
									<div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10">
										<UploadIcon className="size-4 text-amber-500" />
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">Subir Documento</p>
										<p className="text-[10px] text-muted-foreground">PDF, Word, manual</p>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									La IA parsea tu documentación existente
								</p>
							</CardContent>
						</Card>
					</Link>
					<Link href={`${basePath}/capture/new`}>
						<Card className="h-full active:scale-[0.98] transition-transform hover:border-primary/40">
							<CardContent className="p-4">
								<div className="flex items-center gap-3 mb-2">
									<div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
										<VideoIcon className="size-4 text-emerald-500" />
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">Sesión en Vivo</p>
										<Badge variant="secondary" className="text-[8px] h-4">Premium</Badge>
									</div>
								</div>
								<p className="text-xs text-muted-foreground">
									Bot se une a videollamada y extrae procesos
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>

			{/* Already captured processes */}
			{capturedProcesses.length > 0 && (
				<div>
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
						Procesos capturados ({capturedProcesses.length})
					</h2>
					<div className="space-y-2">
						{capturedProcesses.map((p) => (
							<Link key={p.id} href={`${basePath}/process/${p.id}`}>
								<Card className="active:scale-[0.98] transition-transform mb-2">
									<CardContent className="p-4 flex items-center justify-between">
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-foreground truncate">
												{p.name}
											</p>
											<p className="text-[10px] text-muted-foreground">
												{STATUS_LABELS[p.status] ?? p.status}
											</p>
										</div>
										<ArrowRightIcon className="size-4 text-muted-foreground shrink-0" />
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
