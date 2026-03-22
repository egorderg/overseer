import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface GitCommandResult {
	stdout: string;
	stderr: string;
}

export interface GitCommandError {
	code: number;
	stderr: string;
	message: string;
}

export class GitError extends Error {
	constructor(
		message: string,
		public code: number,
		public stderr: string,
	) {
		super(message);
		this.name = "GitError";
	}
}

export async function runGitCommand(
	cwd: string,
	args: string[],
): Promise<GitCommandResult> {
	const command = `git ${args.join(" ")}`;

	try {
		const { stdout, stderr } = await execAsync(command, {
			cwd,
			maxBuffer: 10 * 1024 * 1024,
		});

		return { stdout, stderr };
	} catch (error) {
		const err = error as { code?: number; stderr?: string; message?: string };
		throw new GitError(
			err.message ?? "Git command failed",
			err.code ?? 1,
			err.stderr ?? "",
		);
	}
}

export async function isGitRepository(dir: string): Promise<boolean> {
	try {
		await runGitCommand(dir, ["rev-parse", "--is-inside-work-tree"]);
		return true;
	} catch {
		return false;
	}
}

export async function getCurrentBranch(dir: string): Promise<string | null> {
	try {
		const { stdout } = await runGitCommand(dir, [
			"rev-parse",
			"--abbrev-ref",
			"HEAD",
		]);
		const branch = stdout.trim();
		return branch || null;
	} catch {
		return null;
	}
}
