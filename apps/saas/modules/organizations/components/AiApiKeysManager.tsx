"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ProviderKeyRowProps {
	provider: "anthropic" | "deepseek";
	label: string;
	hasKey: boolean;
	organizationId: string;
	onSaved: () => void;
}

function ProviderKeyRow({
	provider,
	label,
	hasKey,
	organizationId,
	onSaved,
}: ProviderKeyRowProps) {
	const t = useTranslations("organizations.settings.ai.keys");
	const [keyValue, setKeyValue] = useState("");
	const [saved, setSaved] = useState(false);
	const queryClient = useQueryClient();

	const saveMutation = useMutation({
		mutationFn: async () => {
			const input =
				provider === "anthropic"
					? { organizationId, anthropicKey: keyValue }
					: { organizationId, deepseekKey: keyValue };
			return orpcClient.organizations.ai.saveKeys(input);
		},
		onSuccess: () => {
			setSaved(true);
			setKeyValue("");
			setTimeout(() => setSaved(false), 2000);
			queryClient.invalidateQueries({
				queryKey: orpc.organizations.ai.keyStatus.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.organizations.ai.usage.key(),
			});
			onSaved();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.organizations.ai.deleteKey({
				organizationId,
				provider,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.organizations.ai.keyStatus.key(),
			});
			onSaved();
		},
	});

	return (
		<div className="flex flex-col gap-2 rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<KeyIcon className="size-4 text-muted-foreground" />
					<Label className="font-medium">{label}</Label>
				</div>
				<Badge status={hasKey ? "success" : undefined}>
					{hasKey ? t("configured") : t("notConfigured")}
				</Badge>
			</div>

			<div className="flex items-center gap-2">
				<Input
					type="password"
					placeholder={t("placeholder")}
					value={keyValue}
					onChange={(e) => setKeyValue(e.target.value)}
					className="font-mono text-sm"
				/>
				<Button
					size="sm"
					onClick={() => saveMutation.mutate()}
					disabled={!keyValue || saveMutation.isPending}
				>
					<SaveIcon className="size-3.5 mr-1" />
					{saved ? t("saved") : saveMutation.isPending ? t("saving") : t("save")}
				</Button>
				{hasKey && (
					<Button
						size="sm"
						variant="destructive"
						onClick={() => {
							if (window.confirm(t("deleteConfirm"))) {
								deleteMutation.mutate();
							}
						}}
						disabled={deleteMutation.isPending}
					>
						<Trash2Icon className="size-3.5" />
					</Button>
				)}
			</div>
		</div>
	);
}

export function AiApiKeysManager({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations("organizations.settings.ai.keys");

	const { data, isLoading, refetch } = useQuery(
		orpc.organizations.ai.keyStatus.queryOptions({
			input: { organizationId },
		}),
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-72" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-24 w-full" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-medium">{t("title")}</CardTitle>
				<CardDescription className="text-foreground/60 leading-snug">
					{t("description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<ProviderKeyRow
					provider="anthropic"
					label={t("anthropicKey")}
					hasKey={data?.hasAnthropicKey ?? false}
					organizationId={organizationId}
					onSaved={() => refetch()}
				/>
				<ProviderKeyRow
					provider="deepseek"
					label={t("deepseekKey")}
					hasKey={data?.hasDeepseekKey ?? false}
					organizationId={organizationId}
					onSaved={() => refetch()}
				/>
				<p className="text-xs text-muted-foreground pt-1">
					{t("hint")}
				</p>
				{data?.updatedAt && (
					<p className="text-xs text-muted-foreground">
						{t("lastUpdated")}: {new Date(data.updatedAt).toLocaleDateString()}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
