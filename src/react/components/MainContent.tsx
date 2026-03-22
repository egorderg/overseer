import { useCurrentView } from "../store/selectors";
import { DiffView } from "./DiffView";
import { ExplorerView } from "./ExplorerView";
import { TerminalView } from "./TerminalView";

export function MainContent() {
	const currentView = useCurrentView();

	if (!currentView) {
		return (
			<div className="flex min-h-0 flex-1 flex-col justify-center px-8 py-10">
				<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
					No View Selected
				</p>
				<p className="mt-3 text-sm text-text-muted">
					Select a view from the sidebar to get started.
				</p>
			</div>
		);
	}

	const { project, viewId } = currentView;

	if (viewId === "explorer") {
		return <ExplorerView projectPath={project.path} />;
	}

	if (viewId === "diff") {
		return <DiffView projectPath={project.path} />;
	}

	if (viewId.startsWith("terminal-")) {
		return <TerminalView projectPath={project.path} terminalId={viewId} />;
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col justify-center px-8 py-10">
			<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
				Unknown View
			</p>
		</div>
	);
}
