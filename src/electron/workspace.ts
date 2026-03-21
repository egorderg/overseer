import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { WorkspaceProject } from "../shared/contracts";

const OVERSEER_DIR = ".overseer";
const WORKSPACE_FILE = "workspace.json";

type WorkspaceFile = {
	projects: WorkspaceProject[];
};

export class WorkspaceError extends Error {
	code: "duplicate" | "invalid-path" | "persist-failed";

	constructor(
		message: string,
		code: "duplicate" | "invalid-path" | "persist-failed",
	) {
		super(message);
		this.code = code;
		this.name = "WorkspaceError";
	}
}

function normalizeForComparison(nextPath: string): string {
	const normalized = path.normalize(nextPath);
	if (process.platform === "win32") {
		return normalized.toLowerCase();
	}
	return normalized;
}

export function deriveProjectName(projectPath: string): string {
	return path.basename(projectPath);
}

export function getWorkspaceFilePath(homeDir = os.homedir()): string {
	return path.join(homeDir, OVERSEER_DIR, WORKSPACE_FILE);
}

async function ensureWorkspaceFile(homeDir = os.homedir()): Promise<string> {
	const filePath = getWorkspaceFilePath(homeDir);
	const directoryPath = path.dirname(filePath);

	try {
		await fs.mkdir(directoryPath, { recursive: true });
		await fs.access(filePath, fsConstants.F_OK);
	} catch {
		try {
			await writeWorkspaceProjects([], homeDir);
		} catch {
			throw new WorkspaceError(
				"Unable to initialize workspace configuration.",
				"persist-failed",
			);
		}
	}

	return filePath;
}

async function writeJsonAtomic(
	filePath: string,
	content: string,
): Promise<void> {
	const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
	await fs.writeFile(tempPath, content, "utf8");
	await fs.rename(tempPath, filePath);
}

export async function readWorkspaceProjects(
	homeDir = os.homedir(),
): Promise<WorkspaceProject[]> {
	const filePath = await ensureWorkspaceFile(homeDir);
	let fileContent: string;
	try {
		fileContent = await fs.readFile(filePath, "utf8");
	} catch {
		throw new WorkspaceError(
			"Unable to read workspace configuration.",
			"persist-failed",
		);
	}

	try {
		const parsed = JSON.parse(fileContent) as WorkspaceFile;
		if (!Array.isArray(parsed.projects)) {
			return [];
		}

		return parsed.projects.filter(
			(project) =>
				typeof project?.name === "string" && typeof project?.path === "string",
		);
	} catch {
		throw new WorkspaceError(
			"Workspace file is not valid JSON and could not be read.",
			"persist-failed",
		);
	}
}

export async function writeWorkspaceProjects(
	projects: WorkspaceProject[],
	homeDir = os.homedir(),
): Promise<void> {
	const filePath = getWorkspaceFilePath(homeDir);
	const directoryPath = path.dirname(filePath);
	const content = `${JSON.stringify({ projects } satisfies WorkspaceFile, null, 2)}\n`;

	try {
		await fs.mkdir(directoryPath, { recursive: true });
		await writeJsonAtomic(filePath, content);
	} catch {
		throw new WorkspaceError(
			"Unable to persist workspace configuration.",
			"persist-failed",
		);
	}
}

export async function addWorkspaceProject(
	folderPath: string,
	homeDir = os.homedir(),
): Promise<{ project: WorkspaceProject; projects: WorkspaceProject[] }> {
	if (!folderPath.trim()) {
		throw new WorkspaceError("Folder path cannot be empty.", "invalid-path");
	}

	let normalizedPath: string;
	try {
		normalizedPath = await fs.realpath(folderPath);
		const stats = await fs.stat(normalizedPath);
		if (!stats.isDirectory()) {
			throw new WorkspaceError(
				"Selected path is not a folder.",
				"invalid-path",
			);
		}
	} catch (error) {
		if (error instanceof WorkspaceError) {
			throw error;
		}
		throw new WorkspaceError("Selected folder does not exist.", "invalid-path");
	}

	const projects = await readWorkspaceProjects(homeDir);
	const normalizedTarget = normalizeForComparison(normalizedPath);
	const duplicate = projects.some(
		(project) => normalizeForComparison(project.path) === normalizedTarget,
	);

	if (duplicate) {
		throw new WorkspaceError(
			"Folder is already added to this workspace.",
			"duplicate",
		);
	}

	const project: WorkspaceProject = {
		name: deriveProjectName(normalizedPath),
		path: normalizedPath,
	};
	const nextProjects = [...projects, project];
	await writeWorkspaceProjects(nextProjects, homeDir);

	return { project, projects: nextProjects };
}
