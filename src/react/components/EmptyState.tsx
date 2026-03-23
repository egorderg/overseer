type EmptyStateProps = {
	error: string | null;
	onLoadConfig: () => void;
};

export function EmptyState({ error, onLoadConfig }: EmptyStateProps) {
	return (
		<div className="flex h-full w-full items-center justify-center px-6 py-10">
			<section className="w-full max-w-2xl rounded-2xl border border-border bg-surface/90 p-8 shadow-[0_24px_72px_-40px_rgba(15,23,42,0.55)] backdrop-blur-sm">
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-4">
						<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-primary-subtle text-primary">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.75"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
								<path d="M8 10h8" />
								<path d="M8 14h8" />
							</svg>
						</div>
						<div>
							<h2 className="text-xl font-semibold tracking-tight text-text">
								Load a Config File
							</h2>
							<p className="mt-1 text-sm text-text-muted">
								To get started, choose the config file you already use for your
								projects.
							</p>
						</div>
					</div>

					<div className="rounded-xl border border-border/80 bg-surface-muted px-4 py-3 text-sm text-text-muted">
						<p>
							Once loaded, Overseer opens your saved projects so you can
							continue where you left off.
						</p>
					</div>

					<button
						type="button"
						onClick={onLoadConfig}
						className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
					>
						Choose Config JSON
					</button>

					{error ? (
						<p className="rounded-md border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm text-red-400">
							{error}
						</p>
					) : null}
				</div>
			</section>
		</div>
	);
}
