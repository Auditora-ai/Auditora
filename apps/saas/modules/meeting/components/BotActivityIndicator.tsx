"use client";

import { useEffect, useRef, useState } from "react";
import {
	Headphones,
	Brain,
	GitBranch,
	MessageCircle,
	Volume2,
	VolumeX,
} from "lucide-react";
import type { BotActivity, BotActivityType, ActivityLogEntry } from "../types";

const ACTIVITY_CONFIG: Record<
	BotActivityType,
	{ icon: typeof Brain; label: string; color: string; animation: string }
> = {
	listening: {
		icon: Headphones,
		label: "Escuchando...",
		color: "text-muted-foreground",
		animation: "animate-pulse",
	},
	extracting: {
		icon: Brain,
		label: "Procesando...",
		color: "text-primary",
		animation: "animate-spin",
	},
	diagramming: {
		icon: GitBranch,
		label: "Diagramando...",
		color: "text-amber-500",
		animation: "animate-bounce",
	},
	suggesting: {
		icon: MessageCircle,
		label: "Generando pregunta...",
		color: "text-sky-500",
		animation: "animate-pulse",
	},
};

const ACTIVITY_DOT_COLORS: Record<BotActivityType, string> = {
	listening: "bg-muted-foreground",
	extracting: "bg-primary",
	diagramming: "bg-amber-500",
	suggesting: "bg-sky-500",
};

interface BotActivityIndicatorProps {
	activity: BotActivity;
	activityLog: ActivityLogEntry[];
	onNewNodes?: boolean;
}

export function BotActivityIndicator({
	activity,
	activityLog,
	onNewNodes,
}: BotActivityIndicatorProps) {
	const config = ACTIVITY_CONFIG[activity.type];
	const Icon = config.icon;

	// Mute state — owned internally, persisted to localStorage
	const [isMuted, setIsMuted] = useState(true);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		const stored = localStorage.getItem("prozea-mute-sounds");
		if (stored === "false") setIsMuted(false);
	}, []);

	useEffect(() => {
		audioRef.current = new Audio("/sounds/node-added.mp3");
		audioRef.current.volume = 0.3;
	}, []);

	// Play sound on new nodes
	useEffect(() => {
		if (onNewNodes && !isMuted && audioRef.current) {
			try {
				audioRef.current.currentTime = 0;
				audioRef.current.play().catch(() => {
					// Autoplay blocked — silent fail
				});
			} catch {
				// Silent fail
			}
		}
	}, [onNewNodes, isMuted]);

	const toggleMute = () => {
		setIsMuted((prev) => {
			const next = !prev;
			localStorage.setItem("prozea-mute-sounds", String(!next));
			return next;
		});
	};

	return (
		<div className="flex items-center gap-2">
			{/* Activity indicator */}
			<div className="flex items-center gap-1.5">
				<span
					className={`h-1.5 w-1.5 rounded-full ${ACTIVITY_DOT_COLORS[activity.type]} ${
						activity.type !== "listening" ? "animate-pulse" : ""
					}`}
				/>
				<Icon
					className={`h-3 w-3 ${config.color} ${
						activity.type !== "listening" ? config.animation : ""
					}`}
				/>
				<span
					className={`text-[11px] font-medium transition-colors duration-150 ${config.color}`}
				>
					{config.label}
				</span>
			</div>

			{/* Activity log — last 3 actions */}
			{activityLog.length > 0 && (
				<>
					<span className="text-border">|</span>
					<div className="flex items-center gap-1.5 overflow-hidden">
						{activityLog.map((entry, i) => (
							<span
								key={`${entry.timestamp}-${i}`}
								className="text-[10px] text-muted-foreground/70 transition-opacity duration-300"
								style={{
									opacity: 1 - i * 0.25,
								}}
							>
								{entry.detail}
								{i < activityLog.length - 1 && (
									<span className="mx-1 text-border">&middot;</span>
								)}
							</span>
						))}
					</div>
				</>
			)}

			{/* Mute toggle */}
			<button
				type="button"
				onClick={toggleMute}
				className="ml-1 rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
				title={isMuted ? "Activar sonido" : "Silenciar"}
			>
				{isMuted ? (
					<VolumeX className="h-3 w-3" />
				) : (
					<Volume2 className="h-3 w-3" />
				)}
			</button>
		</div>
	);
}
