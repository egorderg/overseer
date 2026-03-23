import { useCurrentView } from "../store/selectors";
import { DiffView } from "./DiffView";
import { ExplorerView } from "./ExplorerView";
import { TerminalView } from "./TerminalView";

export function MainContent() {
	const currentView = useCurrentView();

	if (!currentView) {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center px-8 py-10">
				<div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-8 shadow-[0_18px_48px_-36px_rgba(15,23,42,0.6)]">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-text-subtle">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="22"
								height="22"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect x="3" y="4" width="18" height="16" rx="2" />
								<path d="M8 10h8" />
								<path d="M8 14h5" />
							</svg>
						</div>
						<div>
							<p className="text-xs font-medium uppercase tracking-[0.2em] text-text-subtle">
								No View Selected
							</p>
							<p className="mt-2 text-sm text-text-muted">
								Pick a project and a view from the sidebar to start exploring
								your workspace.
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const { project, viewId } = currentView;
	const view = project.views.find((candidate) => candidate.id === viewId);

	if (!view) {
		return (
			<div className="flex min-h-0 flex-1 flex-col justify-center px-8 py-10">
				<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
					Unknown View
				</p>
			</div>
		);
	}

	if (view.type === "explorer") {
		return (
			<ExplorerView
				projectPath={project.path}
				explorerPath={view.path}
				ignore={view.ignore}
			/>
		);
	}

	if (view.type === "diff") {
		return <DiffView projectPath={project.path} />;
	}

	if (view.type === "terminal") {
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
