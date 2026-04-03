"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
	BoldIcon,
	ItalicIcon,
	UnderlineIcon,
	Heading1Icon,
	Heading2Icon,
	ListIcon,
	ListOrderedIcon,
	LinkIcon,
	ImageIcon,
	VideoIcon,
} from "lucide-react";

interface ProcedureEditorProps {
	/** TipTap JSON content, plain string (legacy), or undefined */
	content: string | Record<string, any> | undefined;
	onChange: (content: Record<string, any>) => void;
	sessionId: string;
}

/** Convert legacy plain string to TipTap JSON doc */
function toTipTapDoc(content: string | Record<string, any> | undefined): Record<string, any> | undefined {
	if (!content) return undefined;
	if (typeof content === "string") {
		if (!content.trim()) return undefined;
		return {
			type: "doc",
			content: content.split("\n").map((line) => ({
				type: "paragraph",
				content: line ? [{ type: "text", text: line }] : [],
			})),
		};
	}
	return content;
}

export function ProcedureEditor({ content, onChange, sessionId }: ProcedureEditorProps) {
	const t = useTranslations("meeting");
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const suppressUpdate = useRef(false);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			Image.configure({
				inline: false,
				allowBase64: true,
			}),
			Link.configure({
				openOnClick: false,
				autolink: true,
			}),
			Placeholder.configure({
				placeholder: t("procedureEditor.placeholder"),
			}),
			Underline,
		],
		content: toTipTapDoc(content),
		editorProps: {
			attributes: {
				class: "procedure-editor-content prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2",
			},
			handlePaste: (view, event) => {
				const items = event.clipboardData?.items;
				if (!items) return false;

				for (const item of items) {
					if (item.type.startsWith("image/")) {
						event.preventDefault();
						const file = item.getAsFile();
						if (file) handleImageUpload(file);
						return true;
					}
				}
				return false;
			},
			handleDrop: (view, event) => {
				const files = event.dataTransfer?.files;
				if (!files?.length) return false;

				for (const file of files) {
					if (file.type.startsWith("image/")) {
						event.preventDefault();
						handleImageUpload(file);
						return true;
					}
				}
				return false;
			},
		},
		onUpdate: ({ editor: ed }) => {
			if (suppressUpdate.current) return;
			onChangeRef.current(ed.getJSON());
		},
	});

	// Update editor content when external content changes (poll update)
	useEffect(() => {
		if (!editor || !content) return;
		const doc = toTipTapDoc(content);
		if (!doc) return;

		const currentJson = JSON.stringify(editor.getJSON());
		const newJson = JSON.stringify(doc);
		if (currentJson !== newJson && !editor.isFocused) {
			suppressUpdate.current = true;
			editor.commands.setContent(doc);
			suppressUpdate.current = false;
		}
	}, [editor, content]);

	const handleImageUpload = useCallback(
		async (file: File) => {
			if (!editor) return;

			// For now, use base64 inline. TODO: S3 upload via /api/sessions/{sessionId}/upload
			const reader = new FileReader();
			reader.onload = () => {
				const src = reader.result as string;
				editor.chain().focus().setImage({ src }).run();
			};
			reader.readAsDataURL(file);
		},
		[editor],
	);

	const handleVideoEmbed = useCallback(() => {
		if (!editor) return;
		const url = prompt("URL del video (YouTube, Vimeo, Loom):");
		if (!url) return;

		// Extract embed URL
		const embedUrl = getEmbedUrl(url);
		if (embedUrl) {
			editor
				.chain()
				.focus()
				.insertContent({
					type: "paragraph",
					content: [
						{
							type: "text",
							marks: [{ type: "link", attrs: { href: url } }],
							text: `🎬 Video: ${url}`,
						},
					],
				})
				.run();
		}
	}, [editor]);

	const handleImageInsert = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = () => {
			const file = input.files?.[0];
			if (file) handleImageUpload(file);
		};
		input.click();
	}, [handleImageUpload]);

	const handleLinkInsert = useCallback(() => {
		if (!editor) return;
		const url = prompt("URL:");
		if (!url) return;
		editor.chain().focus().setLink({ href: url }).run();
	}, [editor]);

	if (!editor) return null;

	return (
		<div className="rounded-md border border-canvas-border bg-background">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 border-b border-canvas-border px-1.5 py-1">
				<ToolBtn
					active={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
					title={t("procedureEditor.bold")}
				>
					<BoldIcon className="h-3.5 w-3.5" />
				</ToolBtn>
				<ToolBtn
					active={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					title={t("procedureEditor.italic")}
				>
					<ItalicIcon className="h-3.5 w-3.5" />
				</ToolBtn>
				<ToolBtn
					active={editor.isActive("underline")}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					title={t("procedureEditor.underline")}
				>
					<UnderlineIcon className="h-3.5 w-3.5" />
				</ToolBtn>

				<div className="mx-1 h-4 w-px bg-canvas-border" />

				<ToolBtn
					active={editor.isActive("heading", { level: 1 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					title={t("procedureEditor.heading1")}
				>
					<Heading1Icon className="h-3.5 w-3.5" />
				</ToolBtn>
				<ToolBtn
					active={editor.isActive("heading", { level: 2 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					title={t("procedureEditor.heading2")}
				>
					<Heading2Icon className="h-3.5 w-3.5" />
				</ToolBtn>

				<div className="mx-1 h-4 w-px bg-canvas-border" />

				<ToolBtn
					active={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					title={t("procedureEditor.bulletList")}
				>
					<ListIcon className="h-3.5 w-3.5" />
				</ToolBtn>
				<ToolBtn
					active={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					title={t("procedureEditor.orderedList")}
				>
					<ListOrderedIcon className="h-3.5 w-3.5" />
				</ToolBtn>

				<div className="mx-1 h-4 w-px bg-canvas-border" />

				<ToolBtn onClick={handleLinkInsert} title={t("procedureEditor.link")}>
					<LinkIcon className="h-3.5 w-3.5" />
				</ToolBtn>
				<ToolBtn onClick={handleImageInsert} title={t("procedureEditor.image")}>
					<ImageIcon className="h-3.5 w-3.5" />
				</ToolBtn>
				<ToolBtn onClick={handleVideoEmbed} title={t("procedureEditor.video")}>
					<VideoIcon className="h-3.5 w-3.5" />
				</ToolBtn>
			</div>

			{/* Editor content */}
			<EditorContent editor={editor} />

			{/* Styles for the editor */}
			<style>{`
				.procedure-editor-content p { margin: 0.25em 0; }
				.procedure-editor-content h1 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0 0.25em; }
				.procedure-editor-content h2 { font-size: 1.1em; font-weight: 600; margin: 0.4em 0 0.2em; }
				.procedure-editor-content h3 { font-size: 1em; font-weight: 600; margin: 0.3em 0 0.15em; }
				.procedure-editor-content ul, .procedure-editor-content ol { padding-left: 1.5em; margin: 0.25em 0; }
				.procedure-editor-content li { margin: 0.1em 0; }
				.procedure-editor-content img { max-width: 100%; border-radius: 4px; margin: 0.5em 0; }
				.procedure-editor-content a { color: #3B8FE8; text-decoration: underline; }
				.procedure-editor-content blockquote { border-left: 3px solid #E2E8F0; padding-left: 0.75em; color: #64748B; }
				.procedure-editor-content .is-empty::before {
					content: attr(data-placeholder);
					color: #94A3B8;
					pointer-events: none;
					float: left;
					height: 0;
				}
			`}</style>
		</div>
	);
}

function ToolBtn({
	children,
	onClick,
	active,
	title,
}: {
	children: React.ReactNode;
	onClick: () => void;
	active?: boolean;
	title: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={`rounded p-1 transition-colors ${
				active
					? "bg-accent text-primary"
					: "text-chrome-text-muted hover:bg-canvas-surface hover:text-canvas-text-secondary"
			}`}
		>
			{children}
		</button>
	);
}

function getEmbedUrl(url: string): string | null {
	// YouTube
	const ytMatch = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
	);
	if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

	// Vimeo
	const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
	if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

	// Loom
	const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
	if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;

	return null;
}
