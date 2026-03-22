export interface AppInfo {
	name: string;
	version: string;
	platform: string;
}

export interface WorkspaceProject {
	name: string;
	path: string;
}

export type AddWorkspaceProjectResult =
	| {
			ok: true;
			project: WorkspaceProject;
			projects: WorkspaceProject[];
	  }
	| {
			ok: false;
			code: "cancelled" | "duplicate" | "invalid-path" | "persist-failed";
			error: string;
	  };

export interface DiffLine {
	type: "context" | "add" | "delete";
	oldNum: number | null;
	newNum: number | null;
	text: string;
}

export interface Hunk {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
	lines: DiffLine[];
}

export interface DiffFile {
	path: string;
	status: "modified" | "new" | "deleted";
	additions: number;
	deletions: number;
	hunks: Hunk[];
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

export interface WindowApi {
	getAppInfo: () => Promise<AppInfo>;
	getWorkspaceProjects: () => Promise<WorkspaceProject[]>;
	addWorkspaceProject: () => Promise<AddWorkspaceProjectResult>;
	getDiff: (projectPath: string) => Promise<GetDiffResult>;
	getCurrentBranch: (projectPath: string) => Promise<string | null>;
}
