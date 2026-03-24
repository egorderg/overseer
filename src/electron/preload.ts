import { contextBridge, ipcRenderer } from "electron";
import {
	type AppInfo,
	type CreateTerminalSessionRequest,
	type CreateTerminalSessionResult,
	type GetDiffResult,
	type ListExplorerFilesResult,
	type LoadConfigResult,
	type OpenInVsCodeResult,
	type ReadExplorerFileResult,
	type TerminalCloseRequest,
	type TerminalDataEvent,
	type TerminalExitEvent,
	type TerminalInputRequest,
	type TerminalMutationResult,
	type TerminalResizeRequest,
	type WindowApi,
} from "../shared/contracts";

const APP_INFO_CHANNEL = "app:info";
const LOAD_CONFIG_CHANNEL = "config:load";
const GET_DIFF_CHANNEL = "git:diff";
const GET_CURRENT_BRANCH_CHANNEL = "git:current-branch";
const OPEN_IN_VSCODE_CHANNEL = "project:open-in-vscode";
const LIST_EXPLORER_FILES_CHANNEL = "explorer:list-files";
const READ_EXPLORER_FILE_CHANNEL = "explorer:read-file";
const CREATE_TERMINAL_SESSION_CHANNEL = "terminal:create-session";
const WRITE_TO_TERMINAL_CHANNEL = "terminal:write";
const RESIZE_TERMINAL_CHANNEL = "terminal:resize";
const CLOSE_TERMINAL_SESSION_CHANNEL = "terminal:close-session";
const TERMINAL_DATA_CHANNEL = "terminal:data";
const TERMINAL_EXIT_CHANNEL = "terminal:exit";

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
	createTerminalSession: (request: CreateTerminalSessionRequest) =>
		ipcRenderer.invoke(
			CREATE_TERMINAL_SESSION_CHANNEL,
			request,
		) as Promise<CreateTerminalSessionResult>,
	writeToTerminal: (request: TerminalInputRequest) =>
		ipcRenderer.invoke(
			WRITE_TO_TERMINAL_CHANNEL,
			request,
		) as Promise<TerminalMutationResult>,
	resizeTerminal: (request: TerminalResizeRequest) =>
		ipcRenderer.invoke(
			RESIZE_TERMINAL_CHANNEL,
			request,
		) as Promise<TerminalMutationResult>,
	closeTerminalSession: (request: TerminalCloseRequest) =>
		ipcRenderer.invoke(
			CLOSE_TERMINAL_SESSION_CHANNEL,
			request,
		) as Promise<TerminalMutationResult>,
	onTerminalData: (listener: (event: TerminalDataEvent) => void) => {
		const handler = (
			_event: Electron.IpcRendererEvent,
			payload: TerminalDataEvent,
		) => {
			listener(payload);
		};

		ipcRenderer.on(TERMINAL_DATA_CHANNEL, handler);
		return () => {
			ipcRenderer.removeListener(TERMINAL_DATA_CHANNEL, handler);
		};
	},
	onTerminalExit: (listener: (event: TerminalExitEvent) => void) => {
		const handler = (
			_event: Electron.IpcRendererEvent,
			payload: TerminalExitEvent,
		) => {
			listener(payload);
		};

		ipcRenderer.on(TERMINAL_EXIT_CHANNEL, handler);
		return () => {
			ipcRenderer.removeListener(TERMINAL_EXIT_CHANNEL, handler);
		};
	},
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

	if (typeof api.createTerminalSession !== "function") {
		throw new Error(
			"[preload] Invalid API contract: createTerminalSession must be a function.",
		);
	}

	if (typeof api.writeToTerminal !== "function") {
		throw new Error(
			"[preload] Invalid API contract: writeToTerminal must be a function.",
		);
	}

	if (typeof api.resizeTerminal !== "function") {
		throw new Error(
			"[preload] Invalid API contract: resizeTerminal must be a function.",
		);
	}

	if (typeof api.closeTerminalSession !== "function") {
		throw new Error(
			"[preload] Invalid API contract: closeTerminalSession must be a function.",
		);
	}

	if (typeof api.onTerminalData !== "function") {
		throw new Error(
			"[preload] Invalid API contract: onTerminalData must be a function.",
		);
	}

	if (typeof api.onTerminalExit !== "function") {
		throw new Error(
			"[preload] Invalid API contract: onTerminalExit must be a function.",
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
			"createTerminalSession",
			"writeToTerminal",
			"resizeTerminal",
			"closeTerminalSession",
			"onTerminalData",
			"onTerminalExit",
		],
		channel: APP_INFO_CHANNEL,
	});
	throw error;
}
