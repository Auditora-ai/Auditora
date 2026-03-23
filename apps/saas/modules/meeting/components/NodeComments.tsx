"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { MessageSquare, Send, X, Trash2 } from "lucide-react";

interface Comment {
	id: string;
	content: string;
	authorName: string;
	createdAt: string;
}

interface NodeCommentsProps {
	processId: string;
	nodeId: string;
	nodeLabel: string;
	isOpen: boolean;
	onClose: () => void;
	position: { x: number; y: number };
}

export function NodeComments({
	processId,
	nodeId,
	nodeLabel,
	isOpen,
	onClose,
	position,
}: NodeCommentsProps) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen && processId) {
			fetch(`/api/processes/${processId}/comments`)
				.then((r) => r.json())
				.then((data) => {
					const filtered = (data.comments || []).filter(
						(c: Comment & { nodeId: string }) => c.nodeId === nodeId,
					);
					setComments(filtered);
				});
		}
	}, [isOpen, processId, nodeId]);

	const handleSubmit = async () => {
		if (!newComment.trim()) return;
		setLoading(true);

		try {
			const res = await fetch(`/api/processes/${processId}/comments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nodeId, content: newComment.trim() }),
			});

			if (res.ok) {
				const { comment } = await res.json();
				setComments((prev) => [comment, ...prev]);
				setNewComment("");
			}
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="absolute z-50 w-72 rounded-lg border border-border bg-card shadow-xl"
			style={{ left: position.x, top: position.y }}
		>
			<div className="flex items-center justify-between border-b p-3">
				<div className="flex items-center gap-2">
					<MessageSquare className="h-4 w-4 text-primary" />
					<span className="text-sm font-medium truncate max-w-[180px]">
						{nodeLabel}
					</span>
				</div>
				<Button variant="ghost" size="icon" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="max-h-48 overflow-y-auto p-3">
				{comments.length === 0 ? (
					<p className="text-center text-xs text-muted-foreground py-4">
						No comments yet
					</p>
				) : (
					<div className="space-y-3">
						{comments.map((c) => (
							<div key={c.id} className="text-sm">
								<div className="flex items-center justify-between">
									<span className="font-medium text-xs">
										{c.authorName}
									</span>
									<span className="text-xs text-muted-foreground">
										{new Date(
											c.createdAt,
										).toLocaleDateString("es-ES")}
									</span>
								</div>
								<p className="mt-0.5 text-xs text-foreground/80">
									{c.content}
								</p>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="border-t p-3">
				<div className="flex gap-2">
					<Textarea
						value={newComment}
						onChange={(e) => setNewComment(e.target.value)}
						placeholder="Add a comment..."
						className="min-h-[60px] resize-none text-xs"
						onKeyDown={(e) => {
							if (e.key === "Enter" && e.metaKey) handleSubmit();
						}}
					/>
				</div>
				<div className="mt-2 flex justify-end">
					<Button
						size="sm"
						onClick={handleSubmit}
						disabled={!newComment.trim() || loading}
						loading={loading}
					>
						<Send className="mr-1 h-3 w-3" />
						Send
					</Button>
				</div>
			</div>
		</div>
	);
}

/** Badge showing comment count on a diagram node */
export function CommentBadge({
	count,
	onClick,
}: {
	count: number;
	onClick: () => void;
}) {
	if (count === 0) return null;

	return (
		<button
			type="button"
			onClick={onClick}
			className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-110"
		>
			{count}
		</button>
	);
}
