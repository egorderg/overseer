import { contextBridge, ipcRenderer } from "electron";
import {
	type AppInfo,
	type GetDiffResult,
	type ListExplorerFilesResult,
	type LoadConfigResult,
	type OpenInVsCodeResult,
	type ReadExplorerFileResult,
	type WindowApi,
} from "../shared/contracts";

const APP_INFO_CHANNEL = "app:info";
const LOAD_CONFIG_CHANNEL = "config:load";
const GET_DIFF_CHANNEL = "git:diff";
const GET_CURRENT_BRANCH_CHANNEL = "git:current-branch";
const OPEN_IN_VSCODE_CHANNEL = "project:open-in-vscode";
const LIST_EXPLORER_FILES_CHANNEL = "explorer:list-files";
const READ_EXPLORER_FILE_CHANNEL = "explorer:read-file";

const api: WindowApi = {
	getAppInfo: () => ipcRenderer.invoke(APP_INFO_CHANNEL) as Promise<AppInfo>,
	loadConfig: () =>
		ipcRenderer.invoke(LOAD_CONFIG_CHANNEL) as Promise<LoadConfigResult>,
	getDiff: (projectPath: string) =>
		ipcRenderer.invoke(GET_DIFF_CHANNEL, projectPath) as Promise<GetDiffResult>,
	getCurrentBranch: (projectPath: string) =>
		ipcRenderer.invoke(GET_CURRENT_BRANCH_CHANNEL, projectPath) as Promise<
			string | null
		>,
	openInVsCode: (projectPath: string) =>
		ipcRenderer.invoke(
			OPEN_IN_VSCODE_CHANNEL,
			projectPath,
		) as Promise<OpenInVsCodeResult>,
	listExplorerFiles: (
		projectPath: string,
		explorerPath: string,
		ignore: string[],
	) =>
		ipcRenderer.invoke(
			LIST_EXPLORER_FILES_CHANNEL,
			projectPath,
			explorerPath,
			ignore,
		) as Promise<ListExplorerFilesResult>,
	readExplorerFile: (
		projectPath: string,
		explorerPath: string,
		filePath: string,
	) =>
		ipcRenderer.invoke(
			READ_EXPLORER_FILE_CHANNEL,
			projectPath,
			explorerPath,
			filePath,
		) as Promise<ReadExplorerFileResult>,
};

try {
	if (typeof api.getAppInfo !== "function") {
		throw new Error(
			"[preload] Invalid API contract: getAppInfo must be a function.",
		);
	}

	if (typeof api.loadConfig !== "function") {
		throw new Error(
			"[preload] Invalid API contract: loadConfig must be a function.",
		);
	}

	if (typeof api.getDiff !== "function") {
		throw new Error(
			"[preload] Invalid API contract: getDiff must be a function.",
		);
	}

	if (typeof api.getCurrentBranch !== "function") {
		throw new Error(
			"[preload] Invalid API contract: getCurrentBranch must be a function.",
		);
	}

	if (typeof api.openInVsCode !== "function") {
		throw new Error(
			"[preload] Invalid API contract: openInVsCode must be a function.",
		);
	}

	if (typeof api.listExplorerFiles !== "function") {
		throw new Error(
			"[preload] Invalid API contract: listExplorerFiles must be a function.",
		);
	}

	if (typeof api.readExplorerFile !== "function") {
		throw new Error(
			"[preload] Invalid API contract: readExplorerFile must be a function.",
		);
	}

	contextBridge.exposeInMainWorld("overseer", api);
} catch (error) {
	const detail = error instanceof Error ? error.message : String(error);
	console.error("[preload] Bridge initialization failed.", {
		detail,
		requiredMethods: [
			"getAppInfo",
			"loadConfig",
			"getDiff",
			"getCurrentBranch",
			"openInVsCode",
			"listExplorerFiles",
			"readExplorerFile",
		],
		channel: APP_INFO_CHANNEL,
	});
	throw error;
}
