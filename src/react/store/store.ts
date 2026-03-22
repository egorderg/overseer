import { create } from "zustand";
import type { AppActions, AppState } from "./types";

type AppStore = AppState & AppActions;

const createInitialState = (): AppState => ({
	projects: {},
	selectedProjectPath: null,
	selectedView: null,
});

export const useAppStore = create<AppStore>((set, get) => ({
	...createInitialState(),

	loadProjects: (projects) => {
		const state = get();
		const newProjects: Record<string, AppState["projects"][string]> = {};

		for (const project of projects) {
			if (state.projects[project.path]) {
				newProjects[project.path] = state.projects[project.path];
				continue;
			}

			newProjects[project.path] = {
				path: project.path,
				name: project.name,
				expanded: false,
				views: [
					{ id: "explorer", label: "Explorer", type: "explorer" },
					{ id: "diff", label: "Diff", type: "diff" },
				],
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

		set({ projects: newProjects });
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
