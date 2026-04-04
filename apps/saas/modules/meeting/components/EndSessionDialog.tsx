"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Loader2Icon, FileTextIcon, SaveIcon, XIcon } from "lucide-react";

export type EndMode = "full" | "save_only" | "discard";

interface EndSessionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (mode: EndMode, newProcessName?: string) => void;
	loading: boolean;
	/** Whether this session already has a linked process */
	hasProcess: boolean;
	/** Default name for new process (from TopBar / session title) */
	defaultProcessName?: string;
}

export function EndSessionDialog({
	open,
	onOpenChange,
	onConfirm,
	loading,
	hasProcess,
	defaultProcessName,
}: EndSessionDialogProps) {
	const t = useTranslations("meeting");
	const [processName, setProcessName] = useState(defaultProcessName || "");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-semibold">{t("endDialog.title")}</DialogTitle>
					<DialogDescription>
						{t("endDialog.description")}
					</DialogDescription>
				</DialogHeader>

				{/* Process name input — only when session has no linked process */}
				{!hasProcess && (
					<div className="space-y-2 py-2">
						<label className="text-sm font-medium">
							{t("endDialog.processNameLabel")}
						</label>
						<Input
							value={processName}
							onChange={(e) => setProcessName(e.target.value)}
							placeholder={t("endDialog.processNamePlaceholder")}
						/>
						<p className="text-xs text-muted-foreground">
							{t("endDialog.processNameHint")}
						</p>
					</div>
				)}

				<div className="flex flex-col gap-2 py-2">
					{/* Option 1: Full — end + generate report */}
					<Button
						variant="primary"
						className="justify-start gap-2"
						disabled={loading}
						onClick={() => onConfirm("full", hasProcess ? undefined : processName)}
					>
						{loading ? (
							<Loader2Icon className="h-4 w-4 animate-spin" />
						) : (
							<FileTextIcon className="h-4 w-4" />
						)}
						{t("endDialog.fullButton")}
					</Button>
					<p className="mb-2 ml-8 text-xs text-muted-foreground">
						{t("endDialog.fullDescription")}
					</p>

					{/* Option 2: Save only — end but no deliverables */}
					<Button
						variant="outline"
						className="justify-start gap-2"
						disabled={loading}
						onClick={() => onConfirm("save_only", hasProcess ? undefined : processName)}
					>
						{loading ? (
							<Loader2Icon className="h-4 w-4 animate-spin" />
						) : (
							<SaveIcon className="h-4 w-4" />
						)}
						{t("endDialog.saveOnlyButton")}
					</Button>
					<p className="mb-2 ml-8 text-xs text-muted-foreground">
						{t("endDialog.saveOnlyDescription")}
					</p>

					{/* Option 3: Discard — cancel session */}
					<Button
						variant="ghost"
						className="justify-start gap-2 text-destructive hover:text-destructive"
						disabled={loading}
						onClick={() => onConfirm("discard")}
					>
						{loading ? (
							<Loader2Icon className="h-4 w-4 animate-spin" />
						) : (
							<XIcon className="h-4 w-4" />
						)}
						{t("endDialog.discardButton")}
					</Button>
					<p className="ml-8 text-xs text-muted-foreground">
						{t("endDialog.discardDescription")}
					</p>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						{t("endDialog.backButton")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
