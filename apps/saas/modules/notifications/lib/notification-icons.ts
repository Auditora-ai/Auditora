import {
	AlertTriangleIcon,
	BellIcon,
	BookOpenIcon,
	CheckCircleIcon,
	ClipboardCheckIcon,
	FileTextIcon,
	GraduationCapIcon,
	MessageCircleIcon,
	RefreshCwIcon,
	UserPlusIcon,
	type LucideIcon,
} from "lucide-react";

const NOTIFICATION_ICON_MAP: Record<string, LucideIcon> = {
	PROCESS_UPDATED: RefreshCwIcon,
	PROCEDURE_UPDATED: FileTextIcon,
	CHANGE_CONFIRMATION_REQUESTED: ClipboardCheckIcon,
	CHANGE_CONFIRMED: CheckCircleIcon,
	CHANGE_OVERDUE: AlertTriangleIcon,
	EVALUATION_ASSIGNED: BookOpenIcon,
	EVALUATION_COMPLETED: CheckCircleIcon,
	EVALUATION_RESULTS_READY: ClipboardCheckIcon,
	COMMENT_ADDED: MessageCircleIcon,
	COMMENT_MENTION: MessageCircleIcon,
	ONBOARDING_ASSIGNED: BookOpenIcon,
	ONBOARDING_COMPLETED: GraduationCapIcon,
	CERTIFICATION_EARNED: GraduationCapIcon,
	CERTIFICATION_EXPIRING: AlertTriangleIcon,
	MEMBER_INVITED: UserPlusIcon,
	WEEKLY_DIGEST: BellIcon,
};

export function getNotificationIcon(type: string): LucideIcon {
	return NOTIFICATION_ICON_MAP[type] ?? BellIcon;
}

const NOTIFICATION_COLOR_MAP: Record<string, string> = {
	PROCESS_UPDATED: "text-blue-400",
	PROCEDURE_UPDATED: "text-blue-400",
	CHANGE_CONFIRMATION_REQUESTED: "text-amber-400",
	CHANGE_CONFIRMED: "text-emerald-400",
	CHANGE_OVERDUE: "text-red-400",
	EVALUATION_ASSIGNED: "text-purple-400",
	EVALUATION_COMPLETED: "text-emerald-400",
	EVALUATION_RESULTS_READY: "text-teal-400",
	COMMENT_ADDED: "text-blue-400",
	COMMENT_MENTION: "text-indigo-400",
	ONBOARDING_ASSIGNED: "text-purple-400",
	ONBOARDING_COMPLETED: "text-emerald-400",
	CERTIFICATION_EARNED: "text-amber-400",
	CERTIFICATION_EXPIRING: "text-red-400",
	MEMBER_INVITED: "text-teal-400",
	WEEKLY_DIGEST: "text-slate-400",
};

export function getNotificationColor(type: string): string {
	return NOTIFICATION_COLOR_MAP[type] ?? "text-slate-400";
}
