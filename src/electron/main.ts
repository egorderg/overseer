import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { ConfigLoaderError, loadAndValidateConfig } from "./config-loader";
import { IPC_CHANNELS } from "./contracts";
import { GitError, getCurrentBranch, isGitRepository } from "./git";
import { getDiff } from "./git-diff";
import {
	addWorkspaceProject,
	readWorkspaceProjects,
	WorkspaceError,
} from "./workspace";

const DEV_SERVER_URL =
	process.env.ELECTRON_RENDERER_URL ?? "http://localhost:5173";
const isDevelopment = process.env.NODE_ENV !== "production";

function getRendererEntry(): { url?: string; htmlPath?: string } {
	if (isDevelopment) {
		return { url: DEV_SERVER_URL };
	}

	return {
		htmlPath: path.join(__dirname, "..", "react", "index.html"),
	};
}

function createWindow(): void {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	const rendererEntry = getRendererEntry();

	if (rendererEntry.url) {
		void win.loadURL(rendererEntry.url);
		return;
	}

	if (rendererEntry.htmlPath) {
		void win.loadFile(rendererEntry.htmlPath);
	}
}

ipcMain.handle(IPC_CHANNELS.appInfo, () => ({
	name: app.getName(),
	version: app.getVersion(),
	platform: process.platform,
}));

ipcMain.handle(IPC_CHANNELS.getWorkspaceProjects, async () => {
	return readWorkspaceProjects(app.getPath("home"));
});

ipcMain.handle(IPC_CHANNELS.addWorkspaceProject, async () => {
	const dialogOwner =
		BrowserWindow.getFocusedWindow() ??
		BrowserWindow.getAllWindows()[0] ??
		null;

	const { canceled, filePaths } = await dialog.showOpenDialog(dialogOwner, {
		properties: ["openDirectory"],
		title: "Select project folder",
	});

	if (canceled || filePaths.length === 0) {
		return {
			ok: false,
			code: "cancelled",
			error: "Folder selection cancelled.",
		};
	}

	try {
		const added = await addWorkspaceProject(filePaths[0], app.getPath("home"));
		return { ok: true, ...added };
	} catch (error) {
		if (error instanceof WorkspaceError) {
			return { ok: false, code: error.code, error: error.message };
		}
		return {
			ok: false,
			code: "persist-failed",
			error: "Unexpected error while adding project.",
		};
	}
});

ipcMain.handle(IPC_CHANNELS.loadConfig, async () => {
	const dialogOwner =
		BrowserWindow.getFocusedWindow() ??
		BrowserWindow.getAllWindows()[0] ??
		null;

	const { canceled, filePaths } = await dialog.showOpenDialog(dialogOwner, {
		properties: ["openFile"],
		title: "Load config file",
		filters: [{ name: "JSON", extensions: ["json"] }],
	});

	if (canceled || filePaths.length === 0) {
		return { ok: false, error: "Cancelled" };
	}

	try {
		const config = await loadAndValidateConfig(filePaths[0]);
		return { ok: true, config };
	} catch (error) {
		if (error instanceof ConfigLoaderError) {
			return { ok: false, error: error.message };
		}
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
});

ipcMain.handle(IPC_CHANNELS.getDiff, async (_event, projectPath: string) => {
	const isRepo = await isGitRepository(projectPath);
	if (!isRepo) {
		return {
			ok: false,
			code: "not-a-repo",
			error: "Not a git repository.",
		} as const;
	}

	try {
		const diff = await getDiff(projectPath);
		return { ok: true, diff } as const;
	} catch (error) {
		if (error instanceof GitError) {
			if (error.code === 127 || error.stderr.includes("not found")) {
				return {
					ok: false,
					code: "git-not-found",
					error: "Git is not installed or not in PATH.",
				} as const;
			}
		}
		return {
			ok: false,
			code: "unknown",
			error: error instanceof Error ? error.message : "Unknown error",
		} as const;
	}
});

ipcMain.handle(
	IPC_CHANNELS.getCurrentBranch,
	async (_event, projectPath: string) => {
		const branch = await getCurrentBranch(projectPath);
		return branch;
	},
);

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
