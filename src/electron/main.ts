import { execFile } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { ConfigLoaderError, loadAndValidateConfig } from "./config-loader";
import { IPC_CHANNELS } from "./contracts";
import { GitError, getCurrentBranch, isGitRepository } from "./git";
import { getDiff } from "./git-diff";
import {
	normalizeTerminalDimensions,
	TerminalSessionManager,
} from "./terminal-session-manager";

const DEV_SERVER_URL =
	process.env.ELECTRON_RENDERER_URL ?? "http://localhost:5173";
const isDevelopment =
	!app.isPackaged && typeof process.env.ELECTRON_RENDERER_URL === "string";
const execFileAsync = promisify(execFile);
const MAX_EXPLORER_FILE_SIZE_BYTES = 1024 * 1024;
const terminalSessionManager = new TerminalSessionManager();

function isSubPath(parentPath: string, targetPath: string): boolean {
	const relative = path.relative(parentPath, targetPath);
	return (
		relative === "" ||
		(!relative.startsWith("..") && !path.isAbsolute(relative))
	);
}

function toPosixPath(filePath: string): string {
	return filePath.split(path.sep).join("/");
}

async function resolveProjectAndExplorerPaths(
	projectPath: string,
	explorerPath: string,
): Promise<
	| {
			ok: true;
			projectRoot: string;
			explorerRoot: string;
	  }
	| { ok: false; error: string }
> {
	if (
		typeof projectPath !== "string" ||
		projectPath.trim() === "" ||
		typeof explorerPath !== "string" ||
		explorerPath.trim() === ""
	) {
		return {
			ok: false,
			error: "Invalid project path or explorer path.",
		};
	}

	let projectRoot: string;
	try {
		projectRoot = await fs.realpath(projectPath);
	} catch {
		return {
			ok: false,
			error: `Project path does not exist: ${projectPath}`,
		};
	}

	const explorerRoot = path.resolve(projectRoot, explorerPath);
	if (!isSubPath(projectRoot, explorerRoot)) {
		return {
			ok: false,
			error: `Explorer path must stay within project path: ${explorerPath}`,
		};
	}

	return {
		ok: true,
		projectRoot,
		explorerRoot,
	};
}

async function listExplorerFiles(
	explorerRoot: string,
	ignoredFolderNames: Set<string>,
): Promise<Array<{ path: string; name: string; directory: string }>> {
	const files: Array<{ path: string; name: string; directory: string }> = [];

	async function walk(currentPath: string): Promise<void> {
		const entries = await fs.readdir(currentPath, { withFileTypes: true });
		entries.sort((left, right) => left.name.localeCompare(right.name));

		for (const entry of entries) {
			if (entry.isSymbolicLink()) {
				continue;
			}

			const entryPath = path.join(currentPath, entry.name);

			if (entry.isDirectory()) {
				if (ignoredFolderNames.has(entry.name)) {
					continue;
				}

				await walk(entryPath);
				continue;
			}

			if (!entry.isFile()) {
				continue;
			}

			const relativePath = toPosixPath(path.relative(explorerRoot, entryPath));
			const directory = path.posix.dirname(relativePath);

			files.push({
				path: relativePath,
				name: entry.name,
				directory: directory === "." ? "." : directory,
			});
		}
	}

	await walk(explorerRoot);
	return files;
}

function getWslFolderUri(projectPath: string): string | null {
	const match = /^\\\\wsl\$\\([^\\]+)\\?(.*)$/i.exec(projectPath);
	if (!match) {
		return null;
	}

	const distro = match[1];
	const unixPath = (match[2] ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
	const encodedPath = unixPath
		.split("/")
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join("/");

	const encodedDistro = encodeURIComponent(distro);
	if (encodedPath.length === 0) {
		return `vscode-remote://wsl+${encodedDistro}/`;
	}

	return `vscode-remote://wsl+${encodedDistro}/${encodedPath}`;
}

async function openProjectInVsCode(projectPath: string): Promise<void> {
	if (process.platform === "darwin") {
		await execFileAsync("open", ["-a", "Visual Studio Code", projectPath]);
		return;
	}

	if (process.platform === "win32") {
		const wslFolderUri = getWslFolderUri(projectPath);
		if (wslFolderUri) {
			await execFileAsync("code", ["--folder-uri", wslFolderUri]);
			return;
		}
	}

	await execFileAsync("code", [projectPath]);
}

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
		autoHideMenuBar: true,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	win.removeMenu();
	win.once("ready-to-show", () => {
		win.maximize();
		win.show();
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

ipcMain.handle(
	IPC_CHANNELS.openInVsCode,
	async (_event, projectPath: unknown) => {
		if (typeof projectPath !== "string" || projectPath.trim() === "") {
			return {
				ok: false,
				error: "Invalid project path.",
			} as const;
		}

		try {
			await fs.access(projectPath, fsConstants.F_OK);
		} catch {
			return {
				ok: false,
				error: `Project path does not exist: ${projectPath}`,
			} as const;
		}

		try {
			await openProjectInVsCode(projectPath);
			return { ok: true } as const;
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			if (detail.includes("ENOENT")) {
				return {
					ok: false,
					error:
						"VS Code command not found. Make sure 'code' is installed in PATH.",
				} as const;
			}

			return {
				ok: false,
				error: `Failed to open project in VS Code: ${detail}`,
			} as const;
		}
	},
);

ipcMain.handle(
	IPC_CHANNELS.listExplorerFiles,
	async (
		_event,
		projectPath: unknown,
		explorerPath: unknown,
		ignore: unknown,
	) => {
		const pathResolution = await resolveProjectAndExplorerPaths(
			typeof projectPath === "string" ? projectPath : "",
			typeof explorerPath === "string" ? explorerPath : "",
		);

		if (!pathResolution.ok) {
			return {
				ok: false,
				code: "invalid-path",
				error: pathResolution.error,
			} as const;
		}

		const { explorerRoot } = pathResolution;

		try {
			const explorerStats = await fs.stat(explorerRoot);
			if (!explorerStats.isDirectory()) {
				return {
					ok: false,
					code: "not-found",
					error: `Explorer path is not a folder: ${explorerPath}`,
				} as const;
			}
		} catch {
			return {
				ok: false,
				code: "not-found",
				error: `Explorer path does not exist: ${explorerPath}`,
			} as const;
		}

		try {
			const ignoredFolderNames = new Set(
				Array.isArray(ignore)
					? ignore
							.filter((entry): entry is string => typeof entry === "string")
							.map((entry) => entry.trim())
							.filter((entry) => entry.length > 0)
					: [],
			);

			const files = await listExplorerFiles(explorerRoot, ignoredFolderNames);
			return { ok: true, files } as const;
		} catch (error) {
			return {
				ok: false,
				code: "unknown",
				error: error instanceof Error ? error.message : "Unknown error",
			} as const;
		}
	},
);

ipcMain.handle(
	IPC_CHANNELS.readExplorerFile,
	async (
		_event,
		projectPath: unknown,
		explorerPath: unknown,
		filePath: unknown,
	) => {
		const pathResolution = await resolveProjectAndExplorerPaths(
			typeof projectPath === "string" ? projectPath : "",
			typeof explorerPath === "string" ? explorerPath : "",
		);

		if (!pathResolution.ok) {
			return {
				ok: false,
				code: "invalid-path",
				error: pathResolution.error,
			} as const;
		}

		if (typeof filePath !== "string" || filePath.trim() === "") {
			return {
				ok: false,
				code: "invalid-path",
				error: "Invalid file path.",
			} as const;
		}

		const { explorerRoot, projectRoot } = pathResolution;
		const resolvedFilePath = path.resolve(explorerRoot, filePath);

		if (
			!isSubPath(explorerRoot, resolvedFilePath) ||
			!isSubPath(projectRoot, resolvedFilePath)
		) {
			return {
				ok: false,
				code: "invalid-path",
				error: "File path must stay within explorer path.",
			} as const;
		}

		let fileStats: import("node:fs").Stats;
		try {
			fileStats = await fs.stat(resolvedFilePath);
		} catch {
			return {
				ok: false,
				code: "not-found",
				error: `File does not exist: ${filePath}`,
			} as const;
		}

		if (!fileStats.isFile()) {
			return {
				ok: false,
				code: "not-a-file",
				error: `Path is not a file: ${filePath}`,
			} as const;
		}

		if (fileStats.size > MAX_EXPLORER_FILE_SIZE_BYTES) {
			return {
				ok: false,
				code: "too-large",
				error: `File is too large to preview (${Math.ceil(fileStats.size / 1024)} KB).`,
			} as const;
		}

		try {
			const content = await fs.readFile(resolvedFilePath, "utf8");
			return { ok: true, content } as const;
		} catch (error) {
			return {
				ok: false,
				code: "unknown",
				error: error instanceof Error ? error.message : "Unknown error",
			} as const;
		}
	},
);

ipcMain.handle(
	IPC_CHANNELS.createTerminalSession,
	async (
		event,
		request: {
			projectPath?: unknown;
			terminalId?: unknown;
			shell?: unknown;
			cwd?: unknown;
			forceRestart?: unknown;
			settings?: unknown;
			cols?: unknown;
			rows?: unknown;
		},
	) => {
		if (typeof request !== "object" || request === null) {
			return { ok: false, error: "Invalid terminal session request." } as const;
		}

		const projectPath =
			typeof request.projectPath === "string" ? request.projectPath : "";
		const terminalId =
			typeof request.terminalId === "string" ? request.terminalId : "";
		if (projectPath.trim() === "" || terminalId.trim() === "") {
			return {
				ok: false,
				error: "Invalid project path or terminal ID.",
			} as const;
		}

		let resolvedProjectPath: string;
		try {
			resolvedProjectPath = await fs.realpath(projectPath);
		} catch {
			return {
				ok: false,
				error: `Project path does not exist: ${projectPath}`,
			} as const;
		}

		let stats: import("node:fs").Stats;
		try {
			stats = await fs.stat(resolvedProjectPath);
		} catch {
			return {
				ok: false,
				error: `Project path does not exist: ${projectPath}`,
			} as const;
		}

		if (!stats.isDirectory()) {
			return {
				ok: false,
				error: `Project path is not a folder: ${projectPath}`,
			} as const;
		}

		if (
			request.shell !== undefined &&
			(typeof request.shell !== "string" || request.shell.trim() === "")
		) {
			return {
				ok: false,
				error: "Invalid terminal shell.",
			} as const;
		}

		if (
			request.cwd !== undefined &&
			(typeof request.cwd !== "string" || request.cwd.trim() === "")
		) {
			return {
				ok: false,
				error: "Invalid terminal cwd.",
			} as const;
		}

		if (
			request.forceRestart !== undefined &&
			typeof request.forceRestart !== "boolean"
		) {
			return {
				ok: false,
				error: "Invalid terminal restart flag.",
			} as const;
		}

		if (typeof request.cwd === "string" && path.isAbsolute(request.cwd)) {
			return {
				ok: false,
				error: "Terminal cwd must be a relative path.",
			} as const;
		}

		const resolvedTerminalCwd =
			typeof request.cwd === "string"
				? path.resolve(resolvedProjectPath, request.cwd)
				: resolvedProjectPath;

		if (!isSubPath(resolvedProjectPath, resolvedTerminalCwd)) {
			return {
				ok: false,
				error: "Terminal cwd must stay within project path.",
			} as const;
		}

		let terminalCwdStats: import("node:fs").Stats;
		try {
			terminalCwdStats = await fs.stat(resolvedTerminalCwd);
		} catch {
			return {
				ok: false,
				error: `Terminal cwd does not exist: ${request.cwd}`,
			} as const;
		}

		if (!terminalCwdStats.isDirectory()) {
			return {
				ok: false,
				error: `Terminal cwd is not a folder: ${request.cwd}`,
			} as const;
		}

		const cols = typeof request.cols === "number" ? request.cols : 80;
		const rows = typeof request.rows === "number" ? request.rows : 24;
		const dimensions = normalizeTerminalDimensions(cols, rows);

		try {
			const created = terminalSessionManager.createSession({
				projectPath: resolvedProjectPath,
				cwd: resolvedTerminalCwd,
				terminalId,
				shell: request.shell,
				forceRestart: request.forceRestart,
				settings:
					typeof request.settings === "object" && request.settings !== null
						? (request.settings as {
								shell?: string;
								shells?: Record<
									string,
									{
										command?: string;
										args?: string[];
										env?: Record<string, string>;
									}
								>;
							})
						: undefined,
				cols: dimensions.cols,
				rows: dimensions.rows,
				webContents: event.sender,
			});

			return {
				ok: true,
				sessionId: created.sessionId,
				shell: created.shell,
				reused: created.reused,
			} as const;
		} catch (error) {
			return {
				ok: false,
				error:
					error instanceof Error ? error.message : "Unknown terminal error.",
			} as const;
		}
	},
);

ipcMain.handle(
	IPC_CHANNELS.writeToTerminal,
	(_event, request: { sessionId?: unknown; data?: unknown }) => {
		if (
			typeof request?.sessionId !== "string" ||
			typeof request?.data !== "string"
		) {
			return { ok: false, error: "Invalid terminal write request." } as const;
		}

		try {
			terminalSessionManager.write(request.sessionId, request.data);
			return { ok: true } as const;
		} catch (error) {
			return {
				ok: false,
				error:
					error instanceof Error ? error.message : "Unknown terminal error.",
			} as const;
		}
	},
);

ipcMain.handle(
	IPC_CHANNELS.resizeTerminal,
	(
		_event,
		request: { sessionId?: unknown; cols?: unknown; rows?: unknown },
	) => {
		if (typeof request?.sessionId !== "string") {
			return { ok: false, error: "Invalid terminal resize request." } as const;
		}

		const cols = typeof request.cols === "number" ? request.cols : 80;
		const rows = typeof request.rows === "number" ? request.rows : 24;
		const dimensions = normalizeTerminalDimensions(cols, rows);

		try {
			terminalSessionManager.resize(
				request.sessionId,
				dimensions.cols,
				dimensions.rows,
			);
			return { ok: true } as const;
		} catch (error) {
			return {
				ok: false,
				error:
					error instanceof Error ? error.message : "Unknown terminal error.",
			} as const;
		}
	},
);

ipcMain.handle(
	IPC_CHANNELS.closeTerminalSession,
	(_event, request: { sessionId?: unknown }) => {
		if (typeof request?.sessionId !== "string") {
			return { ok: false, error: "Invalid terminal close request." } as const;
		}

		terminalSessionManager.close(request.sessionId);
		return { ok: true } as const;
	},
);

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});

	app.on("web-contents-created", (_event, webContents) => {
		webContents.once("destroyed", () => {
			terminalSessionManager.closeForWebContents(webContents.id);
		});
	});
});

app.on("window-all-closed", () => {
	terminalSessionManager.closeAll();

	if (process.platform !== "darwin") {
		app.quit();
	}
});
