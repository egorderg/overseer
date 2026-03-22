import { useEffect } from "react";
import { MainContent } from "./components/MainContent";
import { ProjectsSidebar } from "./components/ProjectsSidebar";
import {
	useCurrentView,
	useLoadProjects,
	useProjects,
	useSelectedView,
} from "./store/selectors";

type AppProps = {
	title: string;
};

export function App({ title }: AppProps) {
	const projects = useProjects();
	const loadProjects = useLoadProjects();
	const currentView = useCurrentView();
	const selectedView = useSelectedView();

	useEffect(() => {
		let isMounted = true;

		async function loadStartupData(): Promise<void> {
			try {
				if (typeof window.overseer?.getWorkspaceProjects === "function") {
					const nextProjects = await window.overseer.getWorkspaceProjects();
					if (isMounted) {
						loadProjects(nextProjects);
					}
				}
			} catch {
				console.error("Unable to load workspace projects.");
			}
		}

		void loadStartupData();

		return () => {
			isMounted = false;
		};
	}, [loadProjects]);

	async function handleAddProject(): Promise<void> {
		if (typeof window.overseer?.addWorkspaceProject !== "function") {
			console.error("Add Project is unavailable in the current runtime.");
			return;
		}

		try {
			const result = await window.overseer.addWorkspaceProject();
			if (result.ok) {
				loadProjects(result.projects);
			}
		} catch {
			console.error("Unable to add project right now.");
		}
	}

	const viewTitle = currentView
		? (currentView.project.views.find((v) => v.id === selectedView)?.label ??
			title)
		: title;

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
