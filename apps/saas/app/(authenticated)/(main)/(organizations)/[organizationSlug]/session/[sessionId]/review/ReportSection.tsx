export function ReportSection({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
	return (
		<section className="rounded-lg border border-stone-200 bg-white overflow-hidden">
			<div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
				<h2
					className="text-lg text-stone-900"
					style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
				>
					{title}
				</h2>
				{actions && <div className="flex items-center gap-2">{actions}</div>}
			</div>
			<div className="px-6 py-5">{children}</div>
		</section>
	);
}
