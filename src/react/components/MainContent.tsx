import {
	useCurrentView,
	useFontSettings,
	useProjects,
	useTerminalSettings,
} from "../store/selectors";
import { DiffView } from "./DiffView";
import { ExplorerView } from "./ExplorerView";
import { TerminalView } from "./TerminalView";

export function MainContent() {
	const currentView = useCurrentView();
	const projects = useProjects();
	const terminalSettings = useTerminalSettings();
	const fontSettings = useFontSettings();
	const terminalViews = Object.values(projects).flatMap((project) =>
		project.views
			.filter((view) => view.type === "terminal")
			.map((view) => ({
				projectPath: project.path,
				terminalId: view.id,
				shell: view.shell,
				command: view.command,
				cwd: view.cwd,
				reloadNonce: project.viewStates.terminals[view.id]?.reloadNonce ?? 0,
			})),
	);

	const isTerminalSelected = currentView
		? currentView.project.views.some(
				(view) => view.id === currentView.viewId && view.type === "terminal",
			)
		: false;

	const activeTerminalKey = currentView
		? `${currentView.project.path}::${currentView.viewId}`
		: null;

	let content = (
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
							Pick a project and a view from the sidebar to start exploring your
							workspace.
						</p>
					</div>
				</div>
			</div>
		</div>
	);

	if (currentView) {
		const { project, viewId } = currentView;
		const view = project.views.find((candidate) => candidate.id === viewId);

		if (!view) {
			content = (
				<div className="flex min-h-0 flex-1 flex-col justify-center px-8 py-10">
					<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
						Unknown View
					</p>
				</div>
			);
		} else if (view.type === "explorer") {
			const explorerReloadNonce =
				project.viewStates.explorers[view.id]?.reloadNonce ?? 0;

			content = (
				<ExplorerView
					projectPath={project.path}
					explorerPath={view.path}
					ignore={view.ignore}
					fontSettings={fontSettings}
					reloadNonce={explorerReloadNonce}
				/>
			);
		} else if (view.type === "diff") {
			const diffReloadNonce = project.viewStates.diff.reloadNonce;

			content = (
				<DiffView
					projectPath={project.path}
					fontSettings={fontSettings}
					reloadNonce={diffReloadNonce}
				/>
			);
		}
	}

	return (
		<div className="relative flex min-h-0 flex-1 overflow-hidden">
			<div className={isTerminalSelected ? "hidden" : "flex min-h-0 flex-1"}>
				{content}
			</div>

			<div
				className={`absolute inset-0 ${
					isTerminalSelected ? "" : "pointer-events-none"
				}`}
			>
				{terminalViews.map((terminalView) => {
					const terminalKey = `${terminalView.projectPath}::${terminalView.terminalId}`;
					const isActive = terminalKey === activeTerminalKey;

					return (
						<div
							key={terminalKey}
							className={isActive ? "flex h-full" : "hidden h-full"}
						>
							<TerminalView
								projectPath={terminalView.projectPath}
								terminalId={terminalView.terminalId}
								shell={terminalView.shell}
								command={terminalView.command}
								cwd={terminalView.cwd}
								reloadNonce={terminalView.reloadNonce}
								settings={terminalSettings}
								fontSettings={fontSettings}
								isActive={isActive}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
