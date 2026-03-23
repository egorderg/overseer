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
	terminals?: { name: string }[];
	collapsed?: boolean;
}

export interface ConfigExplorer {
	name: string;
	path: string;
	ignore?: string[];
}

export interface ConfigFile {
	projects: ConfigProject[];
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
}
