import type { ConfigProject } from "../../shared/contracts";

export type ProjectView =
	| {
			id: string;
			label: string;
			type: "explorer";
			path: string;
			ignore: string[];
	  }
	| { id: "diff"; label: "Diff"; type: "diff" }
	| { id: string; label: string; type: "terminal" };

export interface ExplorerViewState {
	expandedFolders: string[];
	selectedFile: string | null;
}

export interface DiffViewState {
	leftFile: string;
	rightFile: string;
}

export interface TerminalViewState {
	sessionId: string;
	history: string[];
}

export type ProjectViewState =
	| ExplorerViewState
	| DiffViewState
	| TerminalViewState;

export interface ProjectState {
	path: string;
	name: string;
	expanded: boolean;
	views: ProjectView[];
	viewStates: {
		explorers: Record<string, ExplorerViewState>;
		diff: DiffViewState;
		terminals: Record<string, TerminalViewState>;
	};
}

export interface AppState {
	projects: Record<string, ProjectState>;
	selectedProjectPath: string | null;
	selectedView: string | null;
}

export interface AppActions {
	loadConfig: (projects: ConfigProject[]) => void;
	toggleProject: (projectPath: string) => void;
	selectView: (projectPath: string, viewId: string) => void;
	addTerminal: (projectPath: string, label: string) => void;
	updateViewState: (
		projectPath: string,
		viewId: string,
		state: Partial<ProjectViewState>,
	) => void;
}
