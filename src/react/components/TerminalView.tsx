export function TerminalView({
	projectPath,
	terminalId,
}: {
	projectPath: string;
	terminalId: string;
}) {
	return (
		<div className="flex flex-1 flex-col justify-center px-8 py-10">
			<p className="text-sm text-text-muted">
				Terminal ({terminalId}) for: {projectPath}
			</p>
		</div>
	);
}
