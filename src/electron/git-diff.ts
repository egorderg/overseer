import fs from "node:fs/promises";
import path from "node:path";
import type { DiffFile, DiffResult } from "../shared/contracts";
import { runGitCommand } from "./git";

interface GitDiffEntry {
	path: string;
	status: DiffFile["status"];
	oldPath?: string;
}

interface LineStats {
	additions: number;
	deletions: number;
}

function parseNameStatus(output: string): GitDiffEntry[] {
	const entries: GitDiffEntry[] = [];

	for (const line of output.split("\n")) {
		if (!line.trim()) {
			continue;
		}

		const parts = line.split("\t");
		const statusCode = parts[0] ?? "";

		if (statusCode.startsWith("A")) {
			const filePath = parts[1];
			if (filePath) {
				entries.push({ path: filePath, status: "added" });
			}
			continue;
		}

		if (statusCode.startsWith("D")) {
			const filePath = parts[1];
			if (filePath) {
				entries.push({ path: filePath, status: "deleted" });
			}
			continue;
		}

		if (statusCode.startsWith("R") || statusCode.startsWith("C")) {
			const oldPath = parts[1];
			const newPath = parts[2];
			if (newPath) {
				entries.push({ path: newPath, status: "modified", oldPath });
			}
			continue;
		}

		const filePath = parts[1];
		if (filePath) {
			entries.push({ path: filePath, status: "modified" });
		}
	}

	return entries;
}

function parseNumStat(output: string): Map<string, LineStats> {
	const stats = new Map<string, LineStats>();

	for (const line of output.split("\n")) {
		if (!line.trim()) {
			continue;
		}

		const parts = line.split("\t");
		if (parts.length < 3) {
			continue;
		}

		const additionsRaw = parts[0] ?? "0";
		const deletionsRaw = parts[1] ?? "0";
		const filePath = parts[parts.length - 1] ?? "";

		const additions =
			additionsRaw === "-" ? 0 : Number.parseInt(additionsRaw, 10);
		const deletions =
			deletionsRaw === "-" ? 0 : Number.parseInt(deletionsRaw, 10);

		stats.set(filePath, {
			additions: Number.isNaN(additions) ? 0 : additions,
			deletions: Number.isNaN(deletions) ? 0 : deletions,
		});
	}

	return stats;
}

function countLines(content: string): number {
	if (!content) {
		return 0;
	}

	return content.split("\n").length;
}

async function readWorkingTreeFile(filePath: string): Promise<string> {
	try {
		return await fs.readFile(filePath, "utf-8");
	} catch {
		return "";
	}
}

async function readHeadFile(
	projectPath: string,
	filePath: string,
): Promise<string> {
	try {
		const { stdout } = await runGitCommand(projectPath, [
			"show",
			`HEAD:${filePath}`,
		]);
		return stdout;
	} catch {
		return "";
	}
}

function mergeUntrackedFiles(
	entries: GitDiffEntry[],
	untrackedPaths: string[],
): GitDiffEntry[] {
	const merged = new Map<string, GitDiffEntry>();

	for (const entry of entries) {
		merged.set(entry.path, entry);
	}

	for (const filePath of untrackedPaths) {
		if (!merged.has(filePath)) {
			merged.set(filePath, { path: filePath, status: "added" });
		}
	}

	return [...merged.values()];
}

function getCounts(
	entry: GitDiffEntry,
	original: string,
	modified: string,
	lineStats: Map<string, LineStats>,
): LineStats {
	const fromGit = lineStats.get(entry.path);
	if (fromGit) {
		return fromGit;
	}

	if (entry.status === "added") {
		return { additions: countLines(modified), deletions: 0 };
	}

	if (entry.status === "deleted") {
		return { additions: 0, deletions: countLines(original) };
	}

	return { additions: 0, deletions: 0 };
}

async function createDiffFile(
	projectPath: string,
	entry: GitDiffEntry,
	lineStats: Map<string, LineStats>,
): Promise<DiffFile> {
	if (entry.status === "added") {
		const modified = await readWorkingTreeFile(
			path.join(projectPath, entry.path),
		);
		const counts = getCounts(entry, "", modified, lineStats);
		return {
			path: entry.path,
			status: "added",
			original: "",
			modified,
			additions: counts.additions,
			deletions: counts.deletions,
			changedLines: counts.additions + counts.deletions,
		};
	}

	if (entry.status === "deleted") {
		const original = await readHeadFile(projectPath, entry.path);
		const counts = getCounts(entry, original, "", lineStats);
		return {
			path: entry.path,
			status: "deleted",
			original,
			modified: "",
			additions: counts.additions,
			deletions: counts.deletions,
			changedLines: counts.additions + counts.deletions,
		};
	}

	const headPath = entry.oldPath ?? entry.path;
	const [original, modified] = await Promise.all([
		readHeadFile(projectPath, headPath),
		readWorkingTreeFile(path.join(projectPath, entry.path)),
	]);
	const counts = getCounts(entry, original, modified, lineStats);

	return {
		path: entry.path,
		status: "modified",
		original,
		modified,
		additions: counts.additions,
		deletions: counts.deletions,
		changedLines: counts.additions + counts.deletions,
	};
}

export async function getUntrackedFiles(
	projectPath: string,
): Promise<string[]> {
	const { stdout } = await runGitCommand(projectPath, [
		"ls-files",
		"--others",
		"--exclude-standard",
	]);

	return stdout
		.trim()
		.split("\n")
		.filter((line) => line.length > 0);
}

export async function getDiff(projectPath: string): Promise<DiffResult> {
	const [{ stdout: nameStatus }, { stdout: numStat }, untrackedPaths] =
		await Promise.all([
			runGitCommand(projectPath, ["diff", "--name-status", "HEAD"]),
			runGitCommand(projectPath, ["diff", "--numstat", "HEAD"]),
			getUntrackedFiles(projectPath),
		]);

	const trackedEntries = parseNameStatus(nameStatus);
	const filesToDiff = mergeUntrackedFiles(trackedEntries, untrackedPaths);
	const lineStats = parseNumStat(numStat);

	const files = await Promise.all(
		filesToDiff.map((entry) => createDiffFile(projectPath, entry, lineStats)),
	);

	return { files };
}
