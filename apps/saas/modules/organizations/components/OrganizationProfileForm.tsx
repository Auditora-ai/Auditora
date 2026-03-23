"use client";

import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Label } from "@repo/ui/components/label";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

interface OrgProfile {
	industry: string;
	businessModel: string;
	operationsProfile: string;
	employeeCount: string;
	notes: string;
}

export function OrganizationProfileForm() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const [profile, setProfile] = useState<OrgProfile>({
		industry: "",
		businessModel: "",
		operationsProfile: "",
		employeeCount: "",
		notes: "",
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!activeOrganization?.id) return;
		fetch(`/api/organization/profile`)
			.then((r) => r.ok ? r.json() : null)
			.then((data) => {
				if (data) {
					setProfile({
						industry: data.industry || "",
						businessModel: data.businessModel || "",
						operationsProfile: data.operationsProfile || "",
						employeeCount: data.employeeCount || "",
						notes: data.notes || "",
					});
				}
			})
			.catch(() => {})
			.finally(() => setIsLoading(false));
	}, [activeOrganization?.id]);

	const handleSave = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			const res = await fetch("/api/organization/profile", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(profile),
			});
			if (!res.ok) throw new Error("Failed to save");
			toastSuccess("Profile saved");
		} catch {
			toastError("Failed to save profile");
		} finally {
			setIsSaving(false);
		}
	}, [profile]);

	const update = (field: keyof OrgProfile, value: string) => {
		setProfile((prev) => ({ ...prev, [field]: value }));
	};

	if (isLoading) return null;

	return (
		<SettingsItem title="Client Profile" description="This information provides context to the AI during process extraction sessions.">
			<form onSubmit={handleSave} className="space-y-4">
				<div className="space-y-2">
					<Label>Industry</Label>
					<Input
						value={profile.industry}
						onChange={(e) => update("industry", e.target.value)}
						placeholder="e.g. Manufacturing, Healthcare, Financial Services"
					/>
				</div>

				<div className="space-y-2">
					<Label>Business Model</Label>
					<Textarea
						value={profile.businessModel}
						onChange={(e) => update("businessModel", e.target.value)}
						placeholder="Describe the company's business model..."
						rows={3}
					/>
				</div>

				<div className="space-y-2">
					<Label>Operations Profile</Label>
					<Textarea
						value={profile.operationsProfile}
						onChange={(e) => update("operationsProfile", e.target.value)}
						placeholder="Describe the company's operations..."
						rows={3}
					/>
				</div>

				<div className="space-y-2">
					<Label>Employee Count</Label>
					<Input
						value={profile.employeeCount}
						onChange={(e) => update("employeeCount", e.target.value)}
						placeholder="e.g. 50, 500, 5000"
					/>
				</div>

				<div className="space-y-2">
					<Label>Notes</Label>
					<Textarea
						value={profile.notes}
						onChange={(e) => update("notes", e.target.value)}
						placeholder="Additional notes about this client..."
						rows={3}
					/>
				</div>

				<div className="flex justify-end">
					<Button type="submit" loading={isSaving}>
						{t("settings.save")}
					</Button>
				</div>
			</form>
		</SettingsItem>
	);
}
