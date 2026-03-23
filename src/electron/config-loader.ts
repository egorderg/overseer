import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type { ConfigFile, ConfigProject } from "../shared/contracts";

export class ConfigLoaderError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ConfigLoaderError";
	}
}

export async function loadAndValidateConfig(
	filePath: string,
): Promise<ConfigFile> {
	let content: string;
	try {
		content = await fs.readFile(filePath, "utf8");
	} catch {
		throw new ConfigLoaderError(`Failed to read config file: ${filePath}`);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		throw new ConfigLoaderError(`Failed to parse JSON: ${detail}`);
	}

	if (
		typeof parsed !== "object" ||
		parsed === null ||
		!Array.isArray((parsed as Record<string, unknown>).projects)
	) {
		throw new ConfigLoaderError("Config must have a 'projects' array");
	}

	const config = parsed as ConfigFile;

	for (let i = 0; i < config.projects.length; i++) {
		const project = config.projects[i];
		validateProject(project, i);
		await validateProjectPath(project);
	}

	return config;
}

function validateProject(project: ConfigProject, index: number): void {
	if (typeof project.path !== "string" || project.path.trim() === "") {
		throw new ConfigLoaderError(
			`Project at index ${index} missing required field 'path'`,
		);
	}

	if (typeof project.name !== "string" || project.name.trim() === "") {
		throw new ConfigLoaderError(
			`Project at index ${index} missing required field 'name'`,
		);
	}

	if (project.explorers !== undefined) {
		if (!Array.isArray(project.explorers)) {
			throw new ConfigLoaderError(
				`Project '${project.name}' field 'explorers' must be an array`,
			);
		}

		for (let i = 0; i < project.explorers.length; i++) {
			const explorer = project.explorers[i];

			if (typeof explorer.name !== "string" || explorer.name.trim() === "") {
				throw new ConfigLoaderError(
					`Project '${project.name}' explorer at index ${i} missing required field 'name'`,
				);
			}

			if (typeof explorer.path !== "string" || explorer.path.trim() === "") {
				throw new ConfigLoaderError(
					`Project '${project.name}' explorer '${explorer.name}' missing required field 'path'`,
				);
			}

			if (path.isAbsolute(explorer.path)) {
				throw new ConfigLoaderError(
					`Project '${project.name}' explorer '${explorer.name}' path must be relative`,
				);
			}

			if (explorer.ignore !== undefined) {
				if (
					!Array.isArray(explorer.ignore) ||
					explorer.ignore.some(
						(entry) => typeof entry !== "string" || entry.trim() === "",
					)
				) {
					throw new ConfigLoaderError(
						`Project '${project.name}' explorer '${explorer.name}' field 'ignore' must be an array of non-empty strings`,
					);
				}
			}
		}
	}
}

async function validateProjectPath(project: ConfigProject): Promise<void> {
	let realPath: string;
	try {
		realPath = await fs.realpath(project.path);
	} catch {
		throw new ConfigLoaderError(`Project path does not exist: ${project.path}`);
	}

	try {
		await fs.access(realPath, fsConstants.F_OK);
	} catch {
		throw new ConfigLoaderError(`Project path does not exist: ${project.path}`);
	}

	let stats: import("node:fs").Stats;
	try {
		stats = await fs.stat(realPath);
	} catch {
		throw new ConfigLoaderError(`Project path does not exist: ${project.path}`);
	}

	if (!stats.isDirectory()) {
		throw new ConfigLoaderError(
			`Project path is not a folder: ${project.path}`,
		);
	}
}
