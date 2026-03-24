import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type {
	ConfigFile,
	ConfigProject,
	ConfigTerminalShell,
} from "../shared/contracts";

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
	validateTerminalSettings(config);
	validateFontSettings(config);

	for (let i = 0; i < config.projects.length; i++) {
		const project = config.projects[i];
		validateProject(project, i);
		await validateProjectPath(project);
	}

	return config;
}

function validateFontSettings(config: ConfigFile): void {
	const settings = config.font;
	if (settings === undefined) {
		return;
	}

	if (
		typeof settings !== "object" ||
		settings === null ||
		Array.isArray(settings)
	) {
		throw new ConfigLoaderError("Top-level field 'font' must be an object");
	}

	if (
		settings.family !== undefined &&
		(typeof settings.family !== "string" || settings.family.trim() === "")
	) {
		throw new ConfigLoaderError(
			"Top-level field 'font.family' must be a non-empty string",
		);
	}

	if (
		settings.size !== undefined &&
		(typeof settings.size !== "number" ||
			!Number.isFinite(settings.size) ||
			settings.size <= 0)
	) {
		throw new ConfigLoaderError(
			"Top-level field 'font.size' must be a positive number",
		);
	}
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

	if (project.terminals !== undefined) {
		if (!Array.isArray(project.terminals)) {
			throw new ConfigLoaderError(
				`Project '${project.name}' field 'terminals' must be an array`,
			);
		}

		for (let i = 0; i < project.terminals.length; i++) {
			const terminal = project.terminals[i];

			if (typeof terminal.name !== "string" || terminal.name.trim() === "") {
				throw new ConfigLoaderError(
					`Project '${project.name}' terminal at index ${i} missing required field 'name'`,
				);
			}

			if (
				terminal.shell !== undefined &&
				(typeof terminal.shell !== "string" || terminal.shell.trim() === "")
			) {
				throw new ConfigLoaderError(
					`Project '${project.name}' terminal '${terminal.name}' field 'shell' must be a non-empty string`,
				);
			}

			if (
				terminal.command !== undefined &&
				(typeof terminal.command !== "string" || terminal.command.trim() === "")
			) {
				throw new ConfigLoaderError(
					`Project '${project.name}' terminal '${terminal.name}' field 'command' must be a non-empty string`,
				);
			}

			if (
				terminal.cwd !== undefined &&
				(typeof terminal.cwd !== "string" || terminal.cwd.trim() === "")
			) {
				throw new ConfigLoaderError(
					`Project '${project.name}' terminal '${terminal.name}' field 'cwd' must be a non-empty string`,
				);
			}

			if (typeof terminal.cwd === "string" && path.isAbsolute(terminal.cwd)) {
				throw new ConfigLoaderError(
					`Project '${project.name}' terminal '${terminal.name}' field 'cwd' must be relative`,
				);
			}
		}
	}
}

function validateTerminalShellConfig(
	shellName: string,
	shellConfig: ConfigTerminalShell,
): void {
	if (
		shellConfig.command !== undefined &&
		(typeof shellConfig.command !== "string" ||
			shellConfig.command.trim() === "")
	) {
		throw new ConfigLoaderError(
			`Terminal shell '${shellName}' field 'command' must be a non-empty string`,
		);
	}

	if (
		shellConfig.args !== undefined &&
		(!Array.isArray(shellConfig.args) ||
			shellConfig.args.some(
				(entry) => typeof entry !== "string" || entry.trim() === "",
			))
	) {
		throw new ConfigLoaderError(
			`Terminal shell '${shellName}' field 'args' must be an array of non-empty strings`,
		);
	}

	if (shellConfig.env !== undefined) {
		if (
			typeof shellConfig.env !== "object" ||
			shellConfig.env === null ||
			Array.isArray(shellConfig.env)
		) {
			throw new ConfigLoaderError(
				`Terminal shell '${shellName}' field 'env' must be an object of string values`,
			);
		}

		for (const [key, value] of Object.entries(shellConfig.env)) {
			if (key.trim() === "" || typeof value !== "string") {
				throw new ConfigLoaderError(
					`Terminal shell '${shellName}' field 'env' must contain non-empty string keys and string values`,
				);
			}
		}
	}
}

function validateTerminalSettings(config: ConfigFile): void {
	const settings = config.terminal;
	if (settings === undefined) {
		return;
	}

	if (
		typeof settings !== "object" ||
		settings === null ||
		Array.isArray(settings)
	) {
		throw new ConfigLoaderError("Top-level field 'terminal' must be an object");
	}

	if (
		settings.shell !== undefined &&
		(typeof settings.shell !== "string" || settings.shell.trim() === "")
	) {
		throw new ConfigLoaderError(
			"Top-level field 'terminal.shell' must be a non-empty string",
		);
	}

	if (settings.shells !== undefined) {
		if (
			typeof settings.shells !== "object" ||
			settings.shells === null ||
			Array.isArray(settings.shells)
		) {
			throw new ConfigLoaderError(
				"Top-level field 'terminal.shells' must be an object",
			);
		}

		for (const [shellName, shellConfig] of Object.entries(settings.shells)) {
			if (shellName.trim() === "") {
				throw new ConfigLoaderError(
					"Terminal shell names in 'terminal.shells' must be non-empty strings",
				);
			}

			if (
				typeof shellConfig !== "object" ||
				shellConfig === null ||
				Array.isArray(shellConfig)
			) {
				throw new ConfigLoaderError(
					`Terminal shell '${shellName}' configuration must be an object`,
				);
			}

			validateTerminalShellConfig(shellName, shellConfig);
		}
	}

	const shellNames = new Set(Object.keys(settings.shells ?? {}));
	if (settings.shell !== undefined && !shellNames.has(settings.shell)) {
		throw new ConfigLoaderError(
			`Top-level field 'terminal.shell' references unknown shell '${settings.shell}'. Define it in 'terminal.shells'.`,
		);
	}

	for (const project of config.projects) {
		if (project.terminals === undefined) {
			continue;
		}

		for (const terminal of project.terminals) {
			if (terminal.shell === undefined) {
				continue;
			}

			if (!shellNames.has(terminal.shell)) {
				throw new ConfigLoaderError(
					`Project '${project.name}' terminal '${terminal.name}' references unknown shell '${terminal.shell}'. Define it in 'terminal.shells'.`,
				);
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
