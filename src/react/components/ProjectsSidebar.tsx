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

	return (
		<aside className="flex w-80 flex-col border-r border-border bg-surface shadow-sm">
			<div className="border-b border-border px-4 py-3">
				<span className="text-xs font-medium uppercase tracking-[0.15em] text-text-subtle">
					Projects
				</span>
			</div>
			<ul className="space-y-1">
				{projects.length === 0 ? (
					<li className="px-3 py-2 text-sm text-text-subtle">
						No projects yet.
					</li>
				) : (
					projects.map((project) => (
						<li key={project.path}>
							<button
								type="button"
								className="w-full px-4 py-2 text-left text-sm text-text transition hover:bg-surface-muted"
								onClick={() => toggleProject(project.path)}
							>
								<span className="mr-2">{project.expanded ? "▼" : "▶"}</span>
								{project.name}
							</button>
							{project.expanded && (
								<ul className="ml-4 space-y-1 border-l border-border">
									<li>
										<button
											type="button"
											className={`w-full px-4 py-1 text-left text-sm text-text transition hover:bg-surface-muted ${
												selectedProjectPath === project.path &&
												selectedView === "explorer"
													? "bg-surface-muted"
													: ""
											}`}
											onClick={() => selectView(project.path, "explorer")}
										>
											Explorer
										</button>
									</li>
									<li>
										<button
											type="button"
											className={`w-full px-4 py-1 text-left text-sm text-text transition hover:bg-surface-muted ${
												selectedProjectPath === project.path &&
												selectedView === "diff"
													? "bg-surface-muted"
													: ""
											}`}
											onClick={() => selectView(project.path, "diff")}
										>
											Diff
										</button>
									</li>
									{project.views
										.filter((v) => v.type === "terminal")
										.map((terminal) => (
											<li key={terminal.id}>
												<button
													type="button"
													className={`w-full px-4 py-1 text-left text-sm text-text transition hover:bg-surface-muted ${
														selectedProjectPath === project.path &&
														selectedView === terminal.id
															? "bg-surface-muted"
															: ""
													}`}
													onClick={() => selectView(project.path, terminal.id)}
												>
													{terminal.label}
												</button>
											</li>
										))}
								</ul>
							)}
						</li>
					))
				)}
			</ul>
		</aside>
	);
}
