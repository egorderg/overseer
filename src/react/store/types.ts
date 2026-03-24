import type {
	ConfigFile,
	ConfigFontSettings,
	ConfigProject,
	ConfigTerminalSettings,
} from "../../shared/contracts";

export type ProjectView =
	| {
			id: string;
			label: string;
			type: "explorer";
			path: string;
			ignore: string[];
	  }
	| { id: "diff"; label: "Diff"; type: "diff" }
	| {
			id: string;
			label: string;
			type: "terminal";
			shell?: string;
			command?: string;
			cwd?: string;
	  };

export interface ExplorerViewState {
	expandedFolders: string[];
	selectedFile: string | null;
	reloadNonce: number;
}

export interface DiffViewState {
	leftFile: string;
	rightFile: string;
	reloadNonce: number;
}

export interface TerminalViewState {
	sessionId: string;
	history: string[];
	shell: string | null;
	status: "idle" | "connecting" | "connected" | "exited" | "error";
	lastExitCode: number | null;
	lastError: string | null;
	cols: number;
	rows: number;
	reloadNonce: number;
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
	terminalSettings: ConfigTerminalSettings;
	fontSettings: ConfigFontSettings;
	selectedProjectPath: string | null;
	selectedView: string | null;
}

export interface AppActions {
	loadConfig: (config: ConfigFile) => void;
	toggleProject: (projectPath: string) => void;
	selectView: (projectPath: string, viewId: string) => void;
	reloadView: (projectPath: string, viewId: string) => void;
	addTerminal: (projectPath: string, label: string) => void;
	updateViewState: (
		projectPath: string,
		viewId: string,
		state: Partial<ProjectViewState>,
	) => void;
}
