export default function PanoramaLoading() {
	return (
		<div className="flex h-[calc(100vh-56px)] flex-col overflow-auto md:h-[calc(100vh-64px)]">
			{/* Header skeleton */}
			<div className="flex flex-col gap-3 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
				<div>
					<div className="h-7 w-32 animate-pulse rounded bg-muted" />
					<div className="mt-1 h-4 w-48 animate-pulse rounded bg-muted" />
				</div>
				<div className="flex items-center gap-2">
					<div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
					<div className="hidden h-10 w-36 animate-pulse rounded-lg bg-muted md:block" />
				</div>
			</div>

			<div className="flex-1 space-y-5 overflow-auto p-3 md:p-6">
				{/* Hero score + stats skeleton */}
				<div className="rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/60 md:p-6">
					<div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
						{/* Ring skeleton */}
						<div className="flex flex-col items-center gap-2">
							<div className="size-[116px] animate-pulse rounded-full bg-muted" />
							<div className="h-4 w-24 animate-pulse rounded bg-muted" />
						</div>
						{/* Stats skeleton */}
						<div className="w-full flex-1">
							<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
								{[...Array(4)].map((_, i) => (
									<div
										key={i}
										className="rounded-xl bg-white/5 p-2.5 md:bg-transparent md:p-0"
									>
										<div className="mx-auto h-8 w-12 animate-pulse rounded bg-muted md:mx-0" />
										<div className="mx-auto mt-1 h-3 w-16 animate-pulse rounded bg-muted md:mx-0" />
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Quick actions skeleton */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="flex items-center gap-3 rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/60"
						>
							<div className="size-10 animate-pulse rounded-lg bg-muted" />
							<div className="flex-1">
								<div className="h-4 w-24 animate-pulse rounded bg-muted" />
								<div className="mt-1 h-3 w-40 animate-pulse rounded bg-muted" />
							</div>
						</div>
					))}
				</div>

				{/* Two-column skeleton */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{[...Array(2)].map((_, col) => (
						<div key={col}>
							<div className="mb-3 h-4 w-32 animate-pulse rounded bg-muted" />
							<div className="space-y-3">
								{[...Array(3)].map((_, i) => (
									<div
										key={i}
										className="rounded-2xl border border-white/10 bg-card/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-card/60"
									>
										<div className="h-4 w-full animate-pulse rounded bg-muted" />
										<div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-muted" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>

				{/* Activity skeleton */}
				<div>
					<div className="mb-3 h-4 w-32 animate-pulse rounded bg-muted" />
					<div className="space-y-2">
						{[...Array(4)].map((_, i) => (
							<div
								key={i}
								className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/80 px-4 py-3 backdrop-blur-sm dark:border-white/5 dark:bg-card/60"
							>
								<div className="size-2 animate-pulse rounded-full bg-muted" />
								<div className="flex-1">
									<div className="h-4 w-48 animate-pulse rounded bg-muted" />
									<div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted" />
								</div>
								<div className="h-3 w-12 animate-pulse rounded bg-muted" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
