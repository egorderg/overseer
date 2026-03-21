import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { IPC_CHANNELS } from "./contracts";
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
