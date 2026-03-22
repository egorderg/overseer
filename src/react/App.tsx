import { useEffect, useState } from "react";
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
	const [currentBranch, setCurrentBranch] = useState<string | null>(null);

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

	useEffect(() => {
		let isMounted = true;

		async function fetchBranch(): Promise<void> {
			if (
				selectedView !== "diff" ||
				!currentView ||
				typeof window.overseer?.getCurrentBranch !== "function"
			) {
				if (isMounted) {
					setCurrentBranch(null);
				}
				return;
			}

			try {
				const branch = await window.overseer.getCurrentBranch(
					currentView.project.path,
				);
				if (isMounted) {
					setCurrentBranch(branch);
				}
			} catch {
				if (isMounted) {
					setCurrentBranch(null);
				}
			}
		}

		void fetchBranch();

		return () => {
			isMounted = false;
		};
	}, [selectedView, currentView]);

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

	const baseTitle = currentView
		? (currentView.project.views.find((v) => v.id === selectedView)?.label ??
			title)
		: title;

	const viewTitle =
		selectedView === "diff" && currentBranch
			? `${baseTitle} — ${currentBranch}`
			: baseTitle;

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
