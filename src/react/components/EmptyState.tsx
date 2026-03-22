type EmptyStateProps = {
	error: string | null;
	onLoadConfig: () => void;
};

export function EmptyState({ error, onLoadConfig }: EmptyStateProps) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-4">
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
