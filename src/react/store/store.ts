import { create } from "zustand";
import type { ConfigFile, ConfigProject } from "../../shared/contracts";
import type { AppActions, AppState, ProjectView } from "./types";

type AppStore = AppState & AppActions;

const createInitialState = (): AppState => ({
	projects: {},
	terminalSettings: {},
	selectedProjectPath: null,
	selectedView: null,
});

function createInitialTerminalViewState(shell?: string) {
	return {
		sessionId: "",
		history: [],
		shell: shell ?? null,
		status: "idle" as const,
		lastExitCode: null,
		lastError: null,
		cols: 0,
		rows: 0,
	};
}

export const useAppStore = create<AppStore>((set, get) => ({
	...createInitialState(),

	loadConfig: (config: ConfigFile) => {
		const projects: ConfigProject[] = config.projects;
		const newProjects: Record<string, AppState["projects"][string]> = {};

		for (const project of projects) {
			const views: ProjectView[] = [];
			const explorerViewStates: Record<
				string,
				{ expandedFolders: string[]; selectedFile: string | null }
			> = {};

			if (project.explorers) {
				for (const explorer of project.explorers) {
					const explorerId = `explorer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
					views.push({
						id: explorerId,
						label: explorer.name,
						type: "explorer",
						path: explorer.path,
						ignore: explorer.ignore ?? [],
					});
					explorerViewStates[explorerId] = {
						expandedFolders: [],
						selectedFile: null,
					};
				}
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
						shell: terminal.shell,
						command: terminal.command,
					});
				}
			}

			const terminalViewStates: AppState["projects"][string]["viewStates"]["terminals"] =
				{};
			for (const view of views) {
				if (view.type === "terminal") {
					terminalViewStates[view.id] = createInitialTerminalViewState(
						view.shell,
					);
				}
			}

			newProjects[project.path] = {
				path: project.path,
				name: project.name,
				expanded: !project.collapsed,
				views,
				viewStates: {
					explorers: explorerViewStates,
					diff: {
						leftFile: "",
						rightFile: "",
					},
					terminals: terminalViewStates,
				},
			};
		}

		set({
			projects: newProjects,
			terminalSettings: config.terminal ?? {},
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

		const viewExists = project.views.some((view) => view.id === viewId);
		if (!viewExists) return;

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
							[terminalId]: createInitialTerminalViewState(),
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

		let updatedViewStates;

		if (viewId.startsWith("explorer-")) {
			const currentExplorerState = project.viewStates.explorers[viewId];
			if (!currentExplorerState) {
				return;
			}

			updatedViewStates = {
				...project.viewStates,
				explorers: {
					...project.viewStates.explorers,
					[viewId]: {
						...currentExplorerState,
						...stateUpdate,
					},
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
