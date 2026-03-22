export function ExplorerView({ projectPath }: { projectPath: string }) {
	return (
		<div className="flex flex-1 flex-col justify-center px-8 py-10">
			<p className="text-sm text-text-muted">
				File explorer for: {projectPath}
			</p>
		</div>
	);
}
