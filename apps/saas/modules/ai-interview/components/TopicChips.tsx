"use client";

import { useState, useEffect } from "react";
import { SparklesIcon, SearchIcon, PlusIcon } from "lucide-react";

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

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
	deepen: { bg: "#FEF3C7", border: "#D97706", text: "#92400E" },
	explore: { bg: "#EFF6FF", border: "#2563EB", text: "#1E40AF" },
	new: { bg: "#F0FDF4", border: "#16A34A", text: "#166534" },
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
				const colors = TYPE_COLORS[topic.type] || TYPE_COLORS.new;

				return (
					<button
						key={topic.id}
						onClick={() => onSelect(topic)}
						className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all hover:scale-105"
						style={{
							backgroundColor: colors.bg,
							border: `1px solid ${colors.border}`,
							color: colors.text,
						}}
					>
						<Icon className="size-3.5" />
						<span className="font-medium">{topic.label}</span>
						<span className="text-xs opacity-70">{topic.description}</span>
					</button>
				);
			})}
		</div>
	);
}
