export interface AppInfo {
	name: string;
	version: string;
	platform: string;
}

export interface ConfigProject {
	path: string;
	name: string;
	explorers?: ConfigExplorer[];
	diff?: { enabled?: boolean };
	terminals?: ConfigTerminal[];
	collapsed?: boolean;
}

export interface ConfigTerminalShell {
	command?: string;
	args?: string[];
	env?: Record<string, string>;
}

export interface ConfigTerminalSettings {
	shell?: string;
	shells?: Record<string, ConfigTerminalShell>;
}

export interface ConfigFontSettings {
	family?: string;
	size?: number;
}

export interface ConfigTerminal {
	name: string;
	shell?: string;
	command?: string;
	cwd?: string;
}

export interface ConfigExplorer {
	name: string;
	path: string;
	ignore?: string[];
}

export interface ConfigFile {
	projects: ConfigProject[];
	terminal?: ConfigTerminalSettings;
	font?: ConfigFontSettings;
}

export type LoadConfigResult =
	| { ok: true; config: ConfigFile }
	| { ok: false; error: string };

export interface DiffFile {
	path: string;
	status: "modified" | "added" | "deleted";
	original: string;
	modified: string;
	additions: number;
	deletions: number;
	changedLines: number;
}

export interface DiffResult {
	files: DiffFile[];
}

export type GetDiffResult =
	| { ok: true; diff: DiffResult }
	| {
			ok: false;
			code: "not-a-repo" | "git-not-found" | "unknown";
			error: string;
	  };

export type OpenInVsCodeResult =
	| { ok: true }
	| {
			ok: false;
			error: string;
	  };

export interface ExplorerFile {
	path: string;
	name: string;
	directory: string;
}

export type ListExplorerFilesResult =
	| { ok: true; files: ExplorerFile[] }
	| {
			ok: false;
			code: "invalid-path" | "not-found" | "unknown";
			error: string;
	  };

export type ReadExplorerFileResult =
	| { ok: true; content: string }
	| {
			ok: false;
			code:
				| "invalid-path"
				| "not-found"
				| "not-a-file"
				| "too-large"
				| "unknown";
			error: string;
	  };

export interface CreateTerminalSessionRequest {
	projectPath: string;
	terminalId: string;
	shell?: string;
	cwd?: string;
	forceRestart?: boolean;
	settings?: ConfigTerminalSettings;
	cols: number;
	rows: number;
}

export type CreateTerminalSessionResult =
	| {
			ok: true;
			sessionId: string;
			shell: string | null;
			reused: boolean;
	  }
	| {
			ok: false;
			error: string;
	  };

export interface TerminalInputRequest {
	sessionId: string;
	data: string;
}

export interface TerminalResizeRequest {
	sessionId: string;
	cols: number;
	rows: number;
}

export interface TerminalCloseRequest {
	sessionId: string;
}

export type TerminalMutationResult =
	| { ok: true }
	| {
			ok: false;
			error: string;
	  };

export interface TerminalDataEvent {
	sessionId: string;
	data: string;
}

export interface TerminalExitEvent {
	sessionId: string;
	exitCode: number;
	signal: number;
}

export interface WindowApi {
	getAppInfo: () => Promise<AppInfo>;
	loadConfig: () => Promise<LoadConfigResult>;
	getDiff: (projectPath: string) => Promise<GetDiffResult>;
	getCurrentBranch: (projectPath: string) => Promise<string | null>;
	openInVsCode: (projectPath: string) => Promise<OpenInVsCodeResult>;
	listExplorerFiles: (
		projectPath: string,
		explorerPath: string,
		ignore: string[],
	) => Promise<ListExplorerFilesResult>;
	readExplorerFile: (
		projectPath: string,
		explorerPath: string,
		filePath: string,
	) => Promise<ReadExplorerFileResult>;
	createTerminalSession: (
		request: CreateTerminalSessionRequest,
	) => Promise<CreateTerminalSessionResult>;
	writeToTerminal: (
		request: TerminalInputRequest,
	) => Promise<TerminalMutationResult>;
	resizeTerminal: (
		request: TerminalResizeRequest,
	) => Promise<TerminalMutationResult>;
	closeTerminalSession: (
		request: TerminalCloseRequest,
	) => Promise<TerminalMutationResult>;
	onTerminalData: (listener: (event: TerminalDataEvent) => void) => () => void;
	onTerminalExit: (listener: (event: TerminalExitEvent) => void) => () => void;
}
