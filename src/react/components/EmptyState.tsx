type EmptyStateProps = {
	error: string | null;
	onLoadConfig: () => void;
};

export function EmptyState({ error, onLoadConfig }: EmptyStateProps) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-5">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="64"
				height="64"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="text-text-subtle"
			>
				<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
				<path d="M8 10h8" />
				<path d="M8 14h8" />
			</svg>

			<div className="flex flex-col items-center gap-2 text-center">
				<h2 className="text-lg font-semibold text-text">
					No Projects Configured
				</h2>
				<p className="max-w-xs text-sm text-text-muted">
					Load a configuration file to start working with your projects.
				</p>
			</div>

			<button
				type="button"
				onClick={onLoadConfig}
				className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
			>
				Load Config
			</button>

			{error && (
				<p className="max-w-md rounded-md bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
					{error}
				</p>
			)}
		</div>
	);
}
