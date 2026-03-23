"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@repo/ui/components/chart";
import { PieChart, Pie, Cell } from "recharts";
import { useTranslations } from "next-intl";

interface ArchitectureDonutProps {
	core: number;
	strategic: number;
	support: number;
}

const COLORS = {
	core: "#3B82F6",
	strategic: "#7C3AED",
	support: "#16A34A",
};

const chartConfig = {
	core: { label: "Core", color: COLORS.core },
	strategic: { label: "Strategic", color: COLORS.strategic },
	support: { label: "Support", color: COLORS.support },
} satisfies ChartConfig;

export function ArchitectureDonut({ core, strategic, support }: ArchitectureDonutProps) {
	const t = useTranslations("dashboard");
	const total = core + strategic + support;

	const data = [
		{ name: t("arch.core"), value: core, key: "core" },
		{ name: t("arch.strategic"), value: strategic, key: "strategic" },
		{ name: t("arch.support"), value: support, key: "support" },
	];

	// Empty state
	if (total === 0) {
		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">{t("arch.title")}</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-[180px]">
					<div className="text-center">
						<div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-2">
							<span className="text-2xl font-bold text-muted-foreground/50">0</span>
						</div>
						<p className="text-xs text-muted-foreground">{t("arch.empty")}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium">{t("arch.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[180px] w-full">
					<PieChart>
						<ChartTooltip content={<ChartTooltipContent />} />
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={45}
							outerRadius={70}
							paddingAngle={3}
							dataKey="value"
							nameKey="name"
						>
							{data.map((entry) => (
								<Cell
									key={entry.key}
									fill={COLORS[entry.key as keyof typeof COLORS]}
								/>
							))}
						</Pie>
					</PieChart>
				</ChartContainer>
				<div className="flex justify-center gap-4 mt-2">
					{data.map((entry) => (
						<div key={entry.key} className="flex items-center gap-1.5 text-xs">
							<div
								className="w-2.5 h-2.5 rounded-full"
								style={{ backgroundColor: COLORS[entry.key as keyof typeof COLORS] }}
							/>
							<span className="text-muted-foreground">{entry.name}</span>
							<span className="font-semibold">{entry.value}</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
