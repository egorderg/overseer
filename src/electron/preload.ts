import { contextBridge, ipcRenderer } from "electron";
import {
	type AddWorkspaceProjectResult,
	type AppInfo,
	type GetDiffResult,
	type WindowApi,
	type WorkspaceProject,
} from "../shared/contracts";

const APP_INFO_CHANNEL = "app:info";
const WORKSPACE_PROJECTS_CHANNEL = "workspace:projects:list";
const ADD_WORKSPACE_PROJECT_CHANNEL = "workspace:projects:add";
const GET_DIFF_CHANNEL = "git:diff";

const api: WindowApi = {
	getAppInfo: () => ipcRenderer.invoke(APP_INFO_CHANNEL) as Promise<AppInfo>,
	getWorkspaceProjects: () =>
		ipcRenderer.invoke(WORKSPACE_PROJECTS_CHANNEL) as Promise<
			WorkspaceProject[]
		>,
	addWorkspaceProject: () =>
		ipcRenderer.invoke(
			ADD_WORKSPACE_PROJECT_CHANNEL,
		) as Promise<AddWorkspaceProjectResult>,
	getDiff: (projectPath: string) =>
		ipcRenderer.invoke(GET_DIFF_CHANNEL, projectPath) as Promise<GetDiffResult>,
};

try {
	if (typeof api.getAppInfo !== "function") {
		throw new Error(
			"[preload] Invalid API contract: getAppInfo must be a function.",
		);
	}

	if (typeof api.getWorkspaceProjects !== "function") {
		throw new Error(
			"[preload] Invalid API contract: getWorkspaceProjects must be a function.",
		);
	}

	if (typeof api.addWorkspaceProject !== "function") {
		throw new Error(
			"[preload] Invalid API contract: addWorkspaceProject must be a function.",
		);
	}

	if (typeof api.getDiff !== "function") {
		throw new Error(
			"[preload] Invalid API contract: getDiff must be a function.",
		);
	}

	contextBridge.exposeInMainWorld("overseer", api);
} catch (error) {
	const detail = error instanceof Error ? error.message : String(error);
	console.error("[preload] Bridge initialization failed.", {
		detail,
		requiredMethods: [
			"getAppInfo",
			"getWorkspaceProjects",
			"addWorkspaceProject",
			"getDiff",
		],
		channel: APP_INFO_CHANNEL,
	});
	throw error;
}
