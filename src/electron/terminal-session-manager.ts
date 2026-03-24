import type { WebContents } from "electron";
import { type IPty, spawn } from "node-pty";
import type {
	ConfigTerminalSettings,
	TerminalDataEvent,
	TerminalExitEvent,
} from "../shared/contracts";
import { IPC_CHANNELS } from "./contracts";

export interface CreateTerminalSessionInput {
	projectPath: string;
	cwd: string;
	terminalId: string;
	shell?: string;
	forceRestart?: boolean;
	settings?: ConfigTerminalSettings;
	cols: number;
	rows: number;
	webContents: WebContents;
}

interface TerminalSession {
	id: string;
	terminalKey: string;
	webContentsId: number;
	pty: IPty;
}

function getDefaultShellCommand(): {
	command: string;
	args: string[];
} {
	if (process.platform === "win32") {
		return { command: "powershell.exe", args: [] };
	}

	return { command: process.env.SHELL || "/bin/bash", args: [] };
}

function toTerminalKey(projectPath: string, terminalId: string): string {
	return `${projectPath}::${terminalId}`;
}

function createSessionId(terminalId: string): string {
	return `${terminalId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export class TerminalSessionManager {
	private readonly sessionsById = new Map<string, TerminalSession>();
	private readonly sessionIdByTerminalKey = new Map<string, string>();

	createSession(input: CreateTerminalSessionInput): {
		sessionId: string;
		shell: string | null;
		reused: boolean;
	} {
		const resolvedShellName = input.shell ?? input.settings?.shell ?? null;
		const terminalKey = toTerminalKey(input.projectPath, input.terminalId);
		const existingSessionId = this.sessionIdByTerminalKey.get(terminalKey);
		if (existingSessionId) {
			const existingSession = this.sessionsById.get(existingSessionId);
			if (existingSession) {
				if (input.forceRestart) {
					this.close(existingSession.id);
				} else {
					return {
						sessionId: existingSession.id,
						shell: resolvedShellName,
						reused: true,
					};
				}
			}

			this.sessionIdByTerminalKey.delete(terminalKey);
		}

		const shellSettings =
			resolvedShellName === null
				? undefined
				: input.settings?.shells?.[resolvedShellName];
		if (resolvedShellName !== null && shellSettings === undefined) {
			throw new Error(
				`Terminal shell '${resolvedShellName}' is not defined in 'terminal.shells'.`,
			);
		}

		const fallbackShellCommand = getDefaultShellCommand();
		const command = shellSettings?.command ?? fallbackShellCommand.command;
		const args = shellSettings?.args ?? fallbackShellCommand.args;
		const env = {
			...process.env,
			...shellSettings?.env,
		};
		const sessionId = createSessionId(input.terminalId);

		const pty = spawn(command, args, {
			name: "xterm-256color",
			cwd: input.cwd,
			env,
			cols: Math.max(20, Math.floor(input.cols)),
			rows: Math.max(8, Math.floor(input.rows)),
		});

		const session: TerminalSession = {
			id: sessionId,
			terminalKey,
			webContentsId: input.webContents.id,
			pty,
		};

		this.sessionsById.set(sessionId, session);
		this.sessionIdByTerminalKey.set(terminalKey, sessionId);

		pty.onData((data) => {
			if (input.webContents.isDestroyed()) {
				return;
			}

			const payload: TerminalDataEvent = {
				sessionId,
				data,
			};

			input.webContents.send(IPC_CHANNELS.terminalData, payload);
		});

		pty.onExit(({ exitCode, signal }) => {
			this.sessionsById.delete(sessionId);
			this.sessionIdByTerminalKey.delete(terminalKey);

			if (input.webContents.isDestroyed()) {
				return;
			}

			const payload: TerminalExitEvent = {
				sessionId,
				exitCode,
				signal: signal ?? 0,
			};

			input.webContents.send(IPC_CHANNELS.terminalExit, payload);
		});

		return {
			sessionId,
			shell: resolvedShellName,
			reused: false,
		};
	}

	write(sessionId: string, data: string): void {
		const session = this.sessionsById.get(sessionId);
		if (!session) {
			throw new Error("Terminal session not found.");
		}

		session.pty.write(data);
	}

	resize(sessionId: string, cols: number, rows: number): void {
		const session = this.sessionsById.get(sessionId);
		if (!session) {
			throw new Error("Terminal session not found.");
		}

		session.pty.resize(
			Math.max(20, Math.floor(cols)),
			Math.max(8, Math.floor(rows)),
		);
	}

	close(sessionId: string): void {
		const session = this.sessionsById.get(sessionId);
		if (!session) {
			return;
		}

		this.sessionsById.delete(sessionId);
		this.sessionIdByTerminalKey.delete(session.terminalKey);
		session.pty.kill();
	}

	closeForWebContents(webContentsId: number): void {
		const sessionIdsToClose: string[] = [];

		for (const [sessionId, session] of this.sessionsById.entries()) {
			if (session.webContentsId === webContentsId) {
				sessionIdsToClose.push(sessionId);
			}
		}

		for (const sessionId of sessionIdsToClose) {
			this.close(sessionId);
		}
	}

	closeAll(): void {
		for (const sessionId of this.sessionsById.keys()) {
			this.close(sessionId);
		}
	}
}

export function normalizeTerminalDimensions(
	cols: number,
	rows: number,
): { cols: number; rows: number } {
	const normalizedCols = Number.isFinite(cols)
		? Math.max(20, Math.floor(cols))
		: 80;
	const normalizedRows = Number.isFinite(rows)
		? Math.max(8, Math.floor(rows))
		: 24;

	return {
		cols: normalizedCols,
		rows: normalizedRows,
	};
}
