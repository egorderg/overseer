import { useEffect, useState } from "react";
import type { WorkspaceProject } from "../shared/contracts";
import { ProjectsSidebar } from "./components/ProjectsSidebar";

type AppProps = {
	title: string;
};

type AppInfo = {
	name: string;
	version: string;
	platform: string;
};

export function App({ title }: AppProps) {
	const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
	const [projects, setProjects] = useState<WorkspaceProject[]>([]);
	const [isAddingProject, setIsAddingProject] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);

	useEffect(() => {
		let isMounted = true;

		async function loadStartupData(): Promise<void> {
			try {
				if (typeof window.overseer?.getAppInfo === "function") {
					const nextAppInfo = await window.overseer.getAppInfo();
					if (isMounted) {
						setAppInfo(nextAppInfo);
					}
				}

				if (typeof window.overseer?.getWorkspaceProjects === "function") {
					const nextProjects = await window.overseer.getWorkspaceProjects();
					if (isMounted) {
						setProjects(nextProjects);
					}
				}
			} catch {
				if (isMounted) {
					setFeedback("Unable to load workspace projects.");
				}
			}
		}

		void loadStartupData();

		return () => {
			isMounted = false;
		};
	}, []);

	async function handleAddProject(): Promise<void> {
		if (typeof window.overseer?.addWorkspaceProject !== "function") {
			setFeedback("Add Project is unavailable in the current runtime.");
			return;
		}

		setIsAddingProject(true);
		setFeedback(null);

		try {
			const result = await window.overseer.addWorkspaceProject();
			if (!result.ok) {
				if (result.code !== "cancelled") {
					setFeedback(result.error);
				}
				return;
			}

			setProjects(result.projects);
			setFeedback(`Added ${result.project.name}.`);
		} catch {
			setFeedback("Unable to add project right now.");
		} finally {
			setIsAddingProject(false);
		}
	}

	return (
		<main className="flex min-h-screen bg-surface-muted text-text">
			<ProjectsSidebar
				projects={projects}
				isAddingProject={isAddingProject}
				feedback={feedback}
				onAddProject={() => {
					void handleAddProject();
				}}
			/>

			<section className="flex flex-1 flex-col justify-center px-8 py-10">
				<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
					Desktop
				</p>
				<h1 className="mt-3 text-4xl font-semibold text-text">{title}</h1>
				<p className="mt-3 max-w-xl text-text-muted">
					Manage projects from the sidebar and keep your workspace synced in a
					central configuration file.
				</p>
				<div className="mt-8 max-w-sm rounded-xl bg-surface-raised p-4 text-sm text-text-on-raised">
					<div>Platform: {appInfo?.platform ?? "browser"}</div>
					<div>App: {appInfo?.name ?? "Overseer"}</div>
					<div>Version: {appInfo?.version ?? "dev"}</div>
				</div>
			</section>
		</main>
	);
}
