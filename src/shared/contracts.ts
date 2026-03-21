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

export interface WindowApi {
	getAppInfo: () => Promise<AppInfo>;
	getWorkspaceProjects: () => Promise<WorkspaceProject[]>;
	addWorkspaceProject: () => Promise<AddWorkspaceProjectResult>;
}
