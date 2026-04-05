"use client";

import { useState, useEffect } from "react";
import { SparklesIcon, SearchIcon, PlusIcon } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui";

interface TopicSuggestion {
	id: string;
	label: string;
	description: string;
	type: "deepen" | "explore" | "new";
	processId?: string;
}

interface TopicChipsProps {
	onSelect: (topic: TopicSuggestion) => void;
}

const TYPE_ICONS: Record<string, typeof SparklesIcon> = {
	deepen: SparklesIcon,
	explore: SearchIcon,
	new: PlusIcon,
};

const TYPE_STYLES: Record<string, string> = {
	deepen: "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 cursor-pointer",
	explore: "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 cursor-pointer",
	new: "bg-secondary border-border text-secondary-foreground hover:bg-secondary/80 cursor-pointer",
};

export function TopicChips({ onSelect }: TopicChipsProps) {
	const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch("/api/sessions/interview/suggestions");
				if (res.ok) {
					const data = await res.json();
					setSuggestions(data.suggestions || []);
				}
			} catch {
				// Silent — chips are optional
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	if (loading || suggestions.length === 0) return null;

	return (
		<div className="flex flex-wrap justify-center gap-2 px-4 py-3">
			{suggestions.map((topic) => {
				const Icon = TYPE_ICONS[topic.type] || SparklesIcon;
				const styles = TYPE_STYLES[topic.type] || TYPE_STYLES.new;

				return (
					<Badge
						key={topic.id}
						variant="outline"
						onClick={() => onSelect(topic)}
						className={cn(
							"rounded-full px-4 py-2 text-sm transition-all hover:scale-105 min-h-[48px] h-auto gap-1.5",
							styles,
						)}
					>
						<Icon className="size-3.5" />
						<span className="font-medium">{topic.label}</span>
						<span className="text-xs opacity-70">{topic.description}</span>
					</Badge>
				);
			})}
		</div>
	);
}
