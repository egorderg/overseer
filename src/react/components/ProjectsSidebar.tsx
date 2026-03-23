import {
	ChevronDown,
	ChevronRight,
	Code2,
	FileDiff,
	FolderOpen,
	Terminal,
} from "lucide-react";
import { useState } from "react";
import {
	useSelectedProjectPath,
	useSelectedView,
	useSelectView,
	useToggleProject,
} from "../store/selectors";
import type { ProjectState } from "../store/types";

type ProjectsSidebarProps = {
	projects: ProjectState[];
};

export function ProjectsSidebar({ projects }: ProjectsSidebarProps) {
	const toggleProject = useToggleProject();
	const selectView = useSelectView();
	const selectedProjectPath = useSelectedProjectPath();
	const selectedView = useSelectedView();
	const [openInVsCodeErrors, setOpenInVsCodeErrors] = useState<
		Record<string, string>
	>({});

	async function handleOpenInVsCode(projectPath: string): Promise<void> {
		if (typeof window.overseer?.openInVsCode !== "function") {
			setOpenInVsCodeErrors((previous) => ({
				...previous,
				[projectPath]: "Open in IDE is unavailable in the current runtime.",
			}));
			return;
		}

		try {
			const result = await window.overseer.openInVsCode(projectPath);

			if (result.ok) {
				setOpenInVsCodeErrors((previous) => {
					if (!(projectPath in previous)) {
						return previous;
					}

					const { [projectPath]: _removed, ...remaining } = previous;
					return remaining;
				});
				return;
			}

			setOpenInVsCodeErrors((previous) => ({
				...previous,
				[projectPath]: result.error,
			}));
		} catch {
			setOpenInVsCodeErrors((previous) => ({
				...previous,
				[projectPath]: "Unexpected error while opening IDE.",
			}));
		}
	}

	const getProjectInitials = (projectName: string) => {
		const parts = projectName
			.trim()
			.split(/\s+/)
			.filter((part) => part.length > 0);

		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
		}

		const compactName = projectName.replace(/[^a-zA-Z0-9]/g, "");
		const initials = compactName.slice(0, 2).toUpperCase();

		return initials || "PR";
	};

	const getSubEntryClassName = (projectPath: string, viewId: string) => {
		const isSelected =
			selectedProjectPath === projectPath && selectedView === viewId;

		return `w-full border-l-4 ml-0.5 py-1.5 pl-8 pr-4 text-left text-sm transition focus:outline-none ${
			isSelected
				? "border-primary font-medium text-text"
				: "border-transparent font-medium text-text hover:text-text"
		}`;
	};

	const getGroupedViews = (views: ProjectState["views"]) => {
		const coreViews = views.filter((view) => view.type === "diff");
		const explorerViews = views.filter((view) => view.type === "explorer");
		const terminalViews = views.filter((view) => view.type === "terminal");

		return [
			{ title: "Core", icon: FileDiff, views: coreViews },
			{ title: "Explorer", icon: FolderOpen, views: explorerViews },
			{ title: "Terminals", icon: Terminal, views: terminalViews },
		].filter((group) => group.views.length > 0);
	};

	return (
		<aside className="flex w-80 flex-col border-r border-border bg-surface shadow-sm">
			<div className="border-b border-border px-4 py-3">
				<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-subtle">
					Workspace
				</p>
				<h2 className="mt-1 text-sm font-semibold tracking-tight text-text">
					Projects
				</h2>
			</div>
			<ul>
				{projects.length === 0 ? (
					<li className="border-b border-dashed border-border bg-surface-muted px-4 py-3 text-sm text-text-subtle">
						No projects yet.
					</li>
				) : (
					projects.map((project) => (
						<li
							key={project.path}
							className="overflow-hidden border-b border-border bg-surface"
						>
							<div
								className={`relative z-10 flex items-center gap-2 px-2 py-3 text-sm text-text transition ${
									project.expanded
										? "bg-surface shadow-[0_2px_8px_-6px_rgba(15,23,42,0.3)]"
										: "hover:bg-surface-muted"
								}`}
							>
								<button
									type="button"
									className="flex min-w-0 flex-1 items-center gap-2 text-left focus:outline-none"
									onClick={() => toggleProject(project.path)}
								>
									{project.expanded ? (
										<ChevronDown className="h-4 w-4 text-text-subtle" />
									) : (
										<ChevronRight className="h-4 w-4 text-text-subtle" />
									)}
									<span className="inline-flex h-6 w-6 shrink-0 items-center justify-center border border-border/80 bg-primary-subtle text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
										{getProjectInitials(project.name)}
									</span>
									<span className="truncate">{project.name}</span>
								</button>
								<button
									type="button"
									onClick={() => void handleOpenInVsCode(project.path)}
									title="Open project in IDE"
									aria-label={`Open ${project.name} in IDE`}
									className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-surface-muted hover:text-text"
								>
									<Code2 className="h-3.5 w-3.5" />
								</button>
							</div>
							{openInVsCodeErrors[project.path] ? (
								<p className="px-4 pb-2 text-xs text-red-500">
									{openInVsCodeErrors[project.path]}
								</p>
							) : null}
							{project.expanded && (
								<div className="border-t border-border/80 bg-surface-muted py-2">
									<div className="space-y-2">
										{getGroupedViews(project.views).map((group) => (
											<section key={group.title}>
												<p className="flex items-center gap-2 pl-9 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-subtle">
													<group.icon className="h-3.5 w-3.5" />
													{group.title}
												</p>
												<ul className="space-y-1">
													{group.views.map((view) => {
														return (
															<li key={view.id}>
																<button
																	type="button"
																	className={getSubEntryClassName(
																		project.path,
																		view.id,
																	)}
																	onClick={() =>
																		selectView(project.path, view.id)
																	}
																>
																	{view.label}
																</button>
															</li>
														);
													})}
												</ul>
											</section>
										))}
									</div>
								</div>
							)}
						</li>
					))
				)}
			</ul>
		</aside>
	);
}
