import fs from "node:fs/promises";
import path from "node:path";
import type { DiffFile, DiffLine, DiffResult, Hunk } from "../shared/contracts";
import { runGitCommand } from "./git";

const TRUNCATE_LINES = 30;

function parseHunkHeader(header: string): {
	oldStart: number;
	oldLines: number;
	newStart: number;
	newLines: number;
} {
	const match = header.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
	if (!match) {
		return { oldStart: 0, oldLines: 0, newStart: 0, newLines: 0 };
	}

	return {
		oldStart: Number.parseInt(match[1], 10),
		oldLines: match[2] ? Number.parseInt(match[2], 10) : 1,
		newStart: Number.parseInt(match[3], 10),
		newLines: match[4] ? Number.parseInt(match[4], 10) : 1,
	};
}

function parseDiffLines(
	hunkLines: string[],
	oldStart: number,
	newStart: number,
): DiffLine[] {
	const lines: DiffLine[] = [];
	let oldNum = oldStart;
	let newNum = newStart;

	for (const line of hunkLines) {
		if (line.startsWith(" ")) {
			lines.push({ type: "context", oldNum, newNum, text: line.slice(1) });
			oldNum++;
			newNum++;
		} else if (line.startsWith("-")) {
			lines.push({ type: "delete", oldNum, newNum: null, text: line.slice(1) });
			oldNum++;
		} else if (line.startsWith("+")) {
			lines.push({ type: "add", oldNum: null, newNum, text: line.slice(1) });
			newNum++;
		}
	}

	return lines;
}

export function parseUnifiedDiff(output: string): DiffFile[] {
	const files: DiffFile[] = [];
	const lines = output.split("\n");

	let currentFile: DiffFile | null = null;
	let currentHunk: Hunk | null = null;
	let hunkLines: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.startsWith("diff --git ")) {
			if (currentFile && currentHunk) {
				currentHunk.lines = parseDiffLines(
					hunkLines,
					currentHunk.oldStart,
					currentHunk.newStart,
				);
				currentFile.hunks.push(currentHunk);
			}
			if (currentFile) {
				files.push(currentFile);
			}

			const match = line.match(/diff --git a\/(.+?) b\/(.+)$/);
			const filePath = match ? match[2] : "unknown";

			currentFile = {
				path: filePath,
				status: "modified",
				additions: 0,
				deletions: 0,
				hunks: [],
			};
			currentHunk = null;
			hunkLines = [];
			continue;
		}

		if (line.startsWith("new file mode ")) {
			if (currentFile) {
				currentFile.status = "new";
			}
			continue;
		}

		if (line.startsWith("deleted file mode ")) {
			if (currentFile) {
				currentFile.status = "deleted";
			}
			continue;
		}

		if (line.startsWith("@@ ")) {
			if (currentFile && currentHunk) {
				currentHunk.lines = parseDiffLines(
					hunkLines,
					currentHunk.oldStart,
					currentHunk.newStart,
				);
				currentFile.hunks.push(currentHunk);
			}

			const header = parseHunkHeader(line);
			currentHunk = {
				...header,
				lines: [],
			};
			hunkLines = [];
			continue;
		}

		if (
			currentHunk &&
			(line.startsWith(" ") || line.startsWith("+") || line.startsWith("-"))
		) {
			hunkLines.push(line);

			if (currentFile) {
				if (line.startsWith("+")) {
					currentFile.additions++;
				} else if (line.startsWith("-")) {
					currentFile.deletions++;
				}
			}
		}
	}

	if (currentFile && currentHunk) {
		currentHunk.lines = parseDiffLines(
			hunkLines,
			currentHunk.oldStart,
			currentHunk.newStart,
		);
		currentFile.hunks.push(currentHunk);
		files.push(currentFile);
	}

	return files;
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

async function readFileTruncated(filePath: string): Promise<string[]> {
	try {
		const content = await fs.readFile(filePath, "utf-8");
		const lines = content.split("\n");
		return lines.slice(0, TRUNCATE_LINES);
	} catch {
		return [];
	}
}

async function createNewFileDiff(filePath: string): Promise<DiffFile> {
	const lines = await readFileTruncated(filePath);
	const diffLines: DiffLine[] = lines.map((text, index) => ({
		type: "add" as const,
		oldNum: null,
		newNum: index + 1,
		text,
	}));

	return {
		path: filePath,
		status: "new",
		additions: diffLines.length,
		deletions: 0,
		hunks: [
			{
				oldStart: 0,
				oldLines: 0,
				newStart: 1,
				newLines: diffLines.length,
				lines: diffLines,
			},
		],
	};
}

async function createDeletedFileDiff(
	projectPath: string,
	filePath: string,
): Promise<DiffFile> {
	const { stdout } = await runGitCommand(projectPath, [
		"show",
		`HEAD:${filePath}`,
	]);

	const lines = stdout.split("\n").slice(0, TRUNCATE_LINES);
	const diffLines: DiffLine[] = lines.map((text, index) => ({
		type: "delete" as const,
		oldNum: index + 1,
		newNum: null,
		text,
	}));

	return {
		path: filePath,
		status: "deleted",
		additions: 0,
		deletions: diffLines.length,
		hunks: [
			{
				oldStart: 1,
				oldLines: diffLines.length,
				newStart: 0,
				newLines: 0,
				lines: diffLines,
			},
		],
	};
}

export async function getDiff(projectPath: string): Promise<DiffResult> {
	const { stdout } = await runGitCommand(projectPath, [
		"diff",
		"HEAD",
		"--unified=3",
		"--no-color",
	]);

	const files = parseUnifiedDiff(stdout);

	const untrackedPaths = await getUntrackedFiles(projectPath);
	for (const relativePath of untrackedPaths) {
		const absolutePath = path.join(projectPath, relativePath);
		const newFileDiff = await createNewFileDiff(absolutePath);
		files.push({
			...newFileDiff,
			path: relativePath,
		});
	}

	const deletedFiles = files.filter((f) => f.status === "deleted");
	for (const file of deletedFiles) {
		const fullDiff = await createDeletedFileDiff(projectPath, file.path);
		file.hunks = fullDiff.hunks;
		file.deletions = fullDiff.deletions;
	}

	return { files };
}
