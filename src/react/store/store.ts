import { create } from "zustand";
import type { ConfigProject } from "../../shared/contracts";
import type { AppActions, AppState, ProjectView } from "./types";

type AppStore = AppState & AppActions;

const createInitialState = (): AppState => ({
	projects: {},
	selectedProjectPath: null,
	selectedView: null,
});

export const useAppStore = create<AppStore>((set, get) => ({
	...createInitialState(),

	loadConfig: (projects: ConfigProject[]) => {
		const newProjects: Record<string, AppState["projects"][string]> = {};

		for (const project of projects) {
			const views: ProjectView[] = [];

			if (project.explorer?.enabled !== false) {
				views.push({ id: "explorer", label: "Explorer", type: "explorer" });
			}

			if (project.diff?.enabled !== false) {
				views.push({ id: "diff", label: "Diff", type: "diff" });
			}

			if (project.terminals) {
				for (const terminal of project.terminals) {
					const terminalId = `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
					views.push({
						id: terminalId,
						label: terminal.name,
						type: "terminal",
					});
				}
			}

			newProjects[project.path] = {
				path: project.path,
				name: project.name,
				expanded: !project.collapsed,
				views,
				viewStates: {
					explorer: {
						expandedFolders: [],
						selectedFile: null,
					},
					diff: {
						leftFile: "",
						rightFile: "",
					},
					terminals: {},
				},
			};
		}

		set({
			projects: newProjects,
			selectedProjectPath: null,
			selectedView: null,
		});
	},

	toggleProject: (projectPath) => {
		const state = get();
		const project = state.projects[projectPath];
		if (!project) return;

		set({
			projects: {
				...state.projects,
				[projectPath]: {
					...project,
					expanded: !project.expanded,
				},
			},
		});
	},

	selectView: (projectPath, viewId) => {
		const state = get();
		const project = state.projects[projectPath];
		if (!project) return;

		set({
			selectedProjectPath: projectPath,
			selectedView: viewId,
		});
	},

	addTerminal: (projectPath, label) => {
		const state = get();
		const project = state.projects[projectPath];
		if (!project) return;

		const terminalId = `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

		set({
			projects: {
				...state.projects,
				[projectPath]: {
					...project,
					views: [
						...project.views,
						{ id: terminalId, label, type: "terminal" as const },
					],
					viewStates: {
						...project.viewStates,
						terminals: {
							...project.viewStates.terminals,
							[terminalId]: {
								sessionId: "",
								history: [],
							},
						},
					},
				},
			},
		});
	},

	updateViewState: (projectPath, viewId, stateUpdate) => {
		const state = get();
		const project = state.projects[projectPath];
		if (!project) return;

		const viewState =
			project.viewStates[viewId as keyof typeof project.viewStates];
		if (!viewState) return;

		let updatedViewStates;

		if (viewId === "explorer") {
			updatedViewStates = {
				...project.viewStates,
				explorer: {
					...project.viewStates.explorer,
					...stateUpdate,
				},
			};
		} else if (viewId === "diff") {
			updatedViewStates = {
				...project.viewStates,
				diff: {
					...project.viewStates.diff,
					...stateUpdate,
				},
			};
		} else if (viewId.startsWith("terminal-")) {
			updatedViewStates = {
				...project.viewStates,
				terminals: {
					...project.viewStates.terminals,
					[viewId]: {
						...project.viewStates.terminals[viewId],
						...stateUpdate,
					},
				},
			};
		} else {
			return;
		}

		set({
			projects: {
				...state.projects,
				[projectPath]: {
					...project,
					viewStates: updatedViewStates,
				},
			},
		});
	},
}));
