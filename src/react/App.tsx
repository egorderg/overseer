import { useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { MainContent } from "./components/MainContent";
import { ProjectsSidebar } from "./components/ProjectsSidebar";
import {
	useCurrentView,
	useLoadConfig,
	useProjects,
	useSelectedView,
} from "./store/selectors";

type AppProps = {
	title: string;
};

export function App({ title }: AppProps) {
	const projects = useProjects();
	const loadConfig = useLoadConfig();
	const currentView = useCurrentView();
	const selectedView = useSelectedView();
	const [configError, setConfigError] = useState<string | null>(null);

	async function handleLoadConfig(): Promise<void> {
		if (typeof window.overseer?.loadConfig !== "function") {
			setConfigError("Load Config is unavailable in the current runtime.");
			return;
		}

		try {
			const result = await window.overseer.loadConfig();
			if (result.ok) {
				loadConfig(result.config.projects);
				setConfigError(null);
			} else if (result.error !== "Cancelled") {
				setConfigError(result.error);
			}
		} catch {
			setConfigError("Unexpected error while loading config.");
		}
	}

	async function handleAddProject(): Promise<void> {
		if (typeof window.overseer?.addWorkspaceProject !== "function") {
			console.error("Add Project is unavailable in the current runtime.");
			return;
		}

		try {
			const result = await window.overseer.addWorkspaceProject();
			if (result.ok) {
				loadConfig(
					result.projects.map((p) => ({
						path: p.path,
						name: p.name,
					})),
				);
			}
		} catch {
			console.error("Unable to add project right now.");
		}
	}

	const baseTitle = currentView
		? (currentView.project.views.find((v) => v.id === selectedView)?.label ??
			title)
		: title;

	const viewTitle = baseTitle;

	const hasProjects = Object.keys(projects).length > 0;

	if (!hasProjects) {
		return (
			<main className="flex h-screen overflow-hidden bg-surface-muted text-text">
				<EmptyState error={configError} onLoadConfig={handleLoadConfig} />
			</main>
		);
	}

	return (
		<main className="flex h-screen overflow-hidden bg-surface-muted text-text">
			<ProjectsSidebar
				projects={Object.values(projects)}
				onAddProject={() => {
					void handleAddProject();
				}}
			/>

			<section className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<div className="border-b border-border px-8 py-3">
					<span className="text-xs font-medium uppercase tracking-[0.15em] text-text-subtle">
						{viewTitle}
					</span>
				</div>
				<MainContent />
			</section>
		</main>
	);
}
