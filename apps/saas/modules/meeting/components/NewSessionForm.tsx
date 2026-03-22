"use client";

import { Button } from "@repo/ui";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function NewSessionForm({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const t = useTranslations();
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setIsSubmitting(true);

		const formData = new FormData(e.currentTarget);

		try {
			const res = await fetch("/api/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					meetingUrl: formData.get("sessions.new.form.meetingUrl"),
					clientName: formData.get("sessions.new.form.clientName"),
					projectName: formData.get("sessions.new.form.projectName"),
					sessionType: formData.get("sessions.new.form.sessionType"),
					projectId: "temp", // TODO: create/select project
				}),
			});

			if (res.ok) {
				const data = await res.json();
				router.push(
					`/${organizationSlug}/session/${data.sessionId}/live`,
				);
			}
		} catch (error) {
			console.error("Failed to create session:", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card className="p-6">
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-2">
					<Label htmlFor="meetingUrl">{t("sessions.new.form.meetingUrl")}</Label>
					<div className="relative">
						<VideoIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							id="meetingUrl"
							name="meetingUrl"
							placeholder={t("sessions.new.form.meetingUrlPlaceholder")}
							className="pl-10"
							required
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						{t("sessions.new.form.meetingUrlHint")}
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="clientName">{t("sessions.new.form.clientName")}</Label>
						<Input
							id="clientName"
							name="clientName"
							placeholder={t("sessions.new.form.clientNamePlaceholder")}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="projectName">
							{t("sessions.new.form.projectName")}
						</Label>
						<Input
							id="projectName"
							name="projectName"
							placeholder={t("sessions.new.form.projectNamePlaceholder")}
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="sessionType">{t("sessions.new.form.sessionType")}</Label>
					<Select name="sessionType" defaultValue="DISCOVERY">
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="DISCOVERY">
								{t("sessions.new.form.typeDiscovery")}
							</SelectItem>
							<SelectItem value="DEEP_DIVE">
								{t("sessions.new.form.typeDeepDive")}
							</SelectItem>
						</SelectContent>
					</Select>
					<p className="text-xs text-muted-foreground">
						{t("sessions.new.form.sessionTypeHint")}
					</p>
				</div>

				<Button type="submit" className="w-full" disabled={isSubmitting}>
					{isSubmitting ? t("sessions.new.form.creating") : t("sessions.new.form.create")}
				</Button>
			</form>
		</Card>
	);
}
