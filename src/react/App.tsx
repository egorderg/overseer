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

	const baseTitle = currentView
		? (currentView.project.views.find((v) => v.id === selectedView)?.label ??
			title)
		: title;

	const viewTitle = baseTitle;
	const viewContext = currentView ? currentView.project.name : "Workspace";

	const hasProjects = Object.keys(projects).length > 0;

	if (!hasProjects) {
		return (
			<main className="flex h-screen overflow-hidden bg-surface text-text">
				<EmptyState error={configError} onLoadConfig={handleLoadConfig} />
			</main>
		);
	}

	return (
		<main className="flex h-screen overflow-hidden bg-surface text-text">
			<ProjectsSidebar projects={Object.values(projects)} />

			<section className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<div className="border-b border-border px-8 py-3">
					<div className="min-w-0">
						<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-subtle">
							{viewContext}
						</p>
						<h1 className="mt-1 truncate text-sm font-semibold tracking-tight text-text">
							{viewTitle}
						</h1>
					</div>
				</div>
				<MainContent />
			</section>
		</main>
	);
}
