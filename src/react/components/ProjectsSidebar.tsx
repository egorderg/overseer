import type { WorkspaceProject } from "../../shared/contracts";

type ProjectsSidebarProps = {
	projects: WorkspaceProject[];
	isAddingProject: boolean;
	feedback: string | null;
	onAddProject: () => void;
};

export function ProjectsSidebar({
	projects,
	isAddingProject,
	feedback,
	onAddProject,
}: ProjectsSidebarProps) {
	return (
		<aside className="flex w-80 flex-col border-r border-border bg-surface shadow-sm">
			<ul className="space-y-1">
				{projects.length === 0 ? (
					<li className="px-3 py-2 text-sm text-text-subtle">
						No projects yet.
					</li>
				) : (
					projects.map((project) => (
						<li
							key={project.path}
							className="cursor-default px-4 py-2 text-sm text-text transition hover:bg-surface-muted"
						>
							{project.name}
						</li>
					))
				)}
			</ul>

			<div className="mt-auto">
				<button
					type="button"
					onClick={onAddProject}
					disabled={isAddingProject}
					className="w-full rounded-md px-3 py-2 text-sm font-medium text-primary transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isAddingProject ? "Adding..." : "Add Project"}
				</button>
			</div>

			{feedback ? (
				<p className="pb-2 text-xs text-text-muted">{feedback}</p>
			) : null}
		</aside>
	);
}
