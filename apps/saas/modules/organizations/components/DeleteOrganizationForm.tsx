"use client";

import { useState } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { useOrganizationListQuery } from "@organizations/lib/api";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useRouter } from "@shared/hooks/router";
import { useTranslations } from "next-intl";

export function DeleteOrganizationForm() {
	const t = useTranslations();
	const router = useRouter();
	const { refetch: reloadOrganizations } = useOrganizationListQuery();
	const { activeOrganization, setActiveOrganization } =
		useActiveOrganization();
	const [confirmText, setConfirmText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	if (!activeOrganization) {
		return null;
	}

	const isConfirmed = confirmText === activeOrganization.name;

	const handleDelete = async () => {
		if (!isConfirmed) return;

		setIsDeleting(true);
		try {
			const { error } = await authClient.organization.delete({
				organizationId: activeOrganization.id,
			});
			if (error) {
				toastError(t("organizations.settings.notifications.organizationNotDeleted"));
				return;
			}
			toastSuccess(t("organizations.settings.notifications.organizationDeleted"));
			await setActiveOrganization(null);
			await reloadOrganizations();
			router.replace("/");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<SettingsItem
			danger
			title={t("organizations.settings.deleteOrganization.title")}
			description={t("organizations.settings.deleteOrganization.description")}
		>
			<div className="mt-4 space-y-4">
				<div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
					<AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
					<p className="text-sm text-destructive">
						{t("organizations.settings.deleteOrganization.irreversibleWarning")}
					</p>
				</div>

				<div className="space-y-2">
					<label htmlFor="confirm-delete-org" className="text-sm font-medium">
						{t("organizations.settings.deleteOrganization.typeToConfirm", {
							name: activeOrganization.name,
						})}
					</label>
					<Input
						id="confirm-delete-org"
						value={confirmText}
						onChange={(e) => setConfirmText(e.target.value)}
						placeholder={activeOrganization.name}
						autoComplete="off"
					/>
				</div>

				<div className="flex justify-end">
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={!isConfirmed || isDeleting}
						loading={isDeleting}
					>
						{t("organizations.settings.deleteOrganization.submit")}
					</Button>
				</div>
			</div>
		</SettingsItem>
	);
}
