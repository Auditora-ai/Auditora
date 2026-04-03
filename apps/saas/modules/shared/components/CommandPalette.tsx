"use client";

import {
	Dialog,
	DialogContent,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	CompassIcon,
	GraduationCapIcon,
	LayoutDashboardIcon,
	PlusIcon,
	SearchIcon,
	SettingsIcon,
	WorkflowIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";

type CommandItem = {
	id: string;
	label: string;
	section: string;
	icon: React.ElementType;
	action: () => void;
};

export function CommandPalette() {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const router = useRouter();
	const t = useTranslations("commandPalette");
	const tApp = useTranslations("app");
	const { activeOrganization } = useActiveOrganization();

	const basePath = activeOrganization
		? `/${activeOrganization.slug}`
		: "";

	const items = useMemo<CommandItem[]>(() => {
		const actions: CommandItem[] = [
			{
				id: "new-session",
				label: t("newSession"),
				section: t("sections.actions"),
				icon: PlusIcon,
				action: () => {
					if (basePath) router.push(`${basePath}/descubrir/new`);
				},
			},
		];

		if (basePath) {
			actions.push(
				// CAPTURAR
				{
					id: "go-descubrir",
					label: tApp("menu.discover"),
					section: t("sections.discover"),
					icon: CompassIcon,
					action: () => router.push(`${basePath}/descubrir`),
				},
				// DOCUMENTAR
				{
					id: "go-processes",
					label: tApp("menu.processes"),
					section: t("sections.document"),
					icon: WorkflowIcon,
					action: () => router.push(`${basePath}/processes`),
				},
				// EVALUAR
				{
					id: "go-evaluaciones",
					label: tApp("menu.evaluaciones"),
					section: t("sections.evaluate"),
					icon: GraduationCapIcon,
					action: () => router.push(`${basePath}/evaluaciones`),
				},
				// VER
				{
					id: "go-panorama",
					label: tApp("menu.dashboard"),
					section: t("sections.view"),
					icon: LayoutDashboardIcon,
					action: () => router.push(basePath),
				},
				// CONFIGURAR
				{
					id: "go-settings",
					label: tApp("menu.organizationSettings"),
					section: t("sections.navigation"),
					icon: SettingsIcon,
					action: () => router.push(`${basePath}/settings`),
				},
			);
		}

		return actions;
	}, [basePath, router, t, tApp]);

	const filtered = useMemo(() => {
		if (!search) return items;
		const q = search.toLowerCase();
		return items.filter(
			(item) =>
				item.label.toLowerCase().includes(q) ||
				item.section.toLowerCase().includes(q),
		);
	}, [items, search]);

	// Keyboard shortcut to open
	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setOpen((prev) => !prev);
			}
		}
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, []);

	// Reset on open/close
	useEffect(() => {
		if (open) {
			setSearch("");
			setSelectedIndex(0);
		}
	}, [open]);

	// Keyboard navigation
	const onKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === "Enter" && filtered[selectedIndex]) {
				e.preventDefault();
				filtered[selectedIndex].action();
				setOpen(false);
			}
		},
		[filtered, selectedIndex],
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-md gap-0 overflow-hidden p-0">
				<div className="flex items-center border-b px-3">
					<SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
					<Input
						placeholder={t("placeholder")}
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setSelectedIndex(0);
						}}
						onKeyDown={onKeyDown}
						className="border-0 shadow-none focus-visible:ring-0"
						autoFocus
					/>
				</div>

				<div className="max-h-[300px] overflow-y-auto p-2">
					{filtered.length === 0 ? (
						<p className="p-4 text-center text-sm text-muted-foreground">
							{t("noResults")}
						</p>
					) : (
						<div className="space-y-1">
							{filtered.map((item, index) => (
								<button
									key={item.id}
									type="button"
									className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
										index === selectedIndex
											? "bg-accent text-accent-foreground"
											: "hover:bg-accent/50"
									}`}
									onClick={() => {
										item.action();
										setOpen(false);
									}}
									onMouseEnter={() =>
										setSelectedIndex(index)
									}
								>
									<item.icon className="size-4 shrink-0 text-muted-foreground" />
									<span>{item.label}</span>
									<span className="ml-auto text-xs text-muted-foreground">
										{item.section}
									</span>
								</button>
							))}
						</div>
					)}
				</div>

				<div className="border-t px-3 py-2">
					<p className="text-xs text-muted-foreground">
					<kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
						⌘K
					</kbd>{" "}
					{t("toggle")}
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
