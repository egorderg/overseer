import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
	ConfigFontSettings,
	ConfigTerminalSettings,
} from "../../shared/contracts";
import { useProject, useUpdateViewState } from "../store/selectors";

function getTerminalTheme(isDark: boolean) {
	if (isDark) {
		return {
			background: "#0f172a",
			foreground: "#e2e8f0",
			cursor: "#94a3b8",
			selectionBackground: "#1e293b",
		};
	}

	return {
		background: "#ffffff",
		foreground: "#0f172a",
		cursor: "#334155",
		selectionBackground: "#dbeafe",
	};
}

export function TerminalView({
	projectPath,
	terminalId,
	shell,
	command,
	cwd,
	reloadNonce,
	settings,
	fontSettings,
	isActive = true,
}: {
	projectPath: string;
	terminalId: string;
	shell?: string;
	command?: string;
	cwd?: string;
	reloadNonce: number;
	settings: ConfigTerminalSettings;
	fontSettings: ConfigFontSettings;
	isActive?: boolean;
}) {
	const updateViewState = useUpdateViewState();
	const project = useProject(projectPath);
	const terminalState = project?.viewStates.terminals[terminalId];
	const containerRef = useRef<HTMLDivElement | null>(null);
	const terminalRef = useRef<Terminal | null>(null);
	const fitAddonRef = useRef<FitAddon | null>(null);
	const resizeToContainerRef = useRef<(() => void) | null>(null);
	const sessionIdRef = useRef<string>(terminalState?.sessionId ?? "");
	const startupCommandSessionIdRef = useRef<string>("");
	const [runtimeError, setRuntimeError] = useState<string | null>(null);
	const [isDark, setIsDark] = useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);

	const requestedShell = useMemo(
		() => shell ?? terminalState?.shell ?? settings.shell,
		[shell, settings.shell, terminalState?.shell],
	);

	useEffect(() => {
		sessionIdRef.current = terminalState?.sessionId ?? "";
	}, [terminalState?.sessionId]);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (event: MediaQueryListEvent) => {
			setIsDark(event.matches);
		};

		mediaQuery.addEventListener("change", handler);
		return () => {
			mediaQuery.removeEventListener("change", handler);
		};
	}, []);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		if (typeof window.overseer?.createTerminalSession !== "function") {
			setRuntimeError("Terminal is unavailable in the current runtime.");
			updateViewState(projectPath, terminalId, {
				status: "error",
				lastError: "Terminal is unavailable in the current runtime.",
			});
			return;
		}

		const createTerminalSession = window.overseer.createTerminalSession;

		const terminalOptions: ConstructorParameters<typeof Terminal>[0] = {
			cursorBlink: true,
			convertEol: true,
			scrollback: 4000,
			theme: getTerminalTheme(isDark),
		};

		if (typeof fontSettings.family === "string") {
			terminalOptions.fontFamily = fontSettings.family;
		}

		if (typeof fontSettings.size === "number") {
			terminalOptions.fontSize = fontSettings.size;
		}

		const terminal = new Terminal(terminalOptions);
		const fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		terminal.open(containerRef.current);
		fitAddon.fit();

		terminalRef.current = terminal;
		fitAddonRef.current = fitAddon;

		let disposed = false;
		let activeSessionId = "";
		let unsubscribeData: (() => void) | null = null;
		let unsubscribeExit: (() => void) | null = null;
		let createSessionTimeoutId: number | null = null;

		const sendResize = (): void => {
			if (
				!activeSessionId ||
				typeof window.overseer?.resizeTerminal !== "function"
			) {
				return;
			}

			void window.overseer.resizeTerminal({
				sessionId: activeSessionId,
				cols: terminal.cols,
				rows: terminal.rows,
			});

			updateViewState(projectPath, terminalId, {
				cols: terminal.cols,
				rows: terminal.rows,
			});
		};

		const resizeObserver = new ResizeObserver(() => {
			fitAddon.fit();
			sendResize();
		});
		resizeObserver.observe(containerRef.current);
		resizeToContainerRef.current = () => {
			fitAddon.fit();
			sendResize();
		};

		const inputDisposable = terminal.onData((data) => {
			if (
				!activeSessionId ||
				typeof window.overseer?.writeToTerminal !== "function"
			) {
				return;
			}

			void window.overseer.writeToTerminal({
				sessionId: activeSessionId,
				data,
			});
		});

		updateViewState(projectPath, terminalId, {
			status: "connecting",
			lastError: null,
			shell: requestedShell ?? null,
			cols: terminal.cols,
			rows: terminal.rows,
		});

		createSessionTimeoutId = window.setTimeout(() => {
			const forceRestart = reloadNonce > 0;

			void createTerminalSession({
				projectPath,
				terminalId,
				shell: requestedShell,
				cwd,
				forceRestart,
				settings,
				cols: terminal.cols,
				rows: terminal.rows,
			})
				.then((result) => {
					if (disposed) {
						return;
					}

					if (!result.ok) {
						setRuntimeError(result.error);
						terminal.writeln(`\r\n[overseer] ${result.error}`);
						updateViewState(projectPath, terminalId, {
							status: "error",
							lastError: result.error,
						});
						return;
					}

					setRuntimeError(null);
					activeSessionId = result.sessionId;
					sessionIdRef.current = result.sessionId;
					updateViewState(projectPath, terminalId, {
						sessionId: result.sessionId,
						shell: result.shell,
						status: "connected",
						lastError: null,
					});

					if (
						typeof command === "string" &&
						command.trim() !== "" &&
						typeof window.overseer?.writeToTerminal === "function" &&
						startupCommandSessionIdRef.current !== result.sessionId
					) {
						startupCommandSessionIdRef.current = result.sessionId;
						void window.overseer.writeToTerminal({
							sessionId: result.sessionId,
							data: `${command}\r`,
						});
					}

					if (typeof window.overseer?.onTerminalData === "function") {
						unsubscribeData = window.overseer.onTerminalData((event) => {
							if (event.sessionId !== activeSessionId) {
								return;
							}

							terminal.write(event.data);
						});
					}

					if (typeof window.overseer?.onTerminalExit === "function") {
						unsubscribeExit = window.overseer.onTerminalExit((event) => {
							if (event.sessionId !== activeSessionId) {
								return;
							}

							const exitMessage = `\r\n[overseer] terminal exited (code ${event.exitCode})`;
							terminal.writeln(exitMessage);
							updateViewState(projectPath, terminalId, {
								status: "exited",
								lastExitCode: event.exitCode,
								sessionId: "",
							});
							activeSessionId = "";
							sessionIdRef.current = "";
						});
					}

					sendResize();
				})
				.catch((error) => {
					const detail =
						error instanceof Error ? error.message : "Unknown terminal error.";
					setRuntimeError(detail);
					terminal.writeln(`\r\n[overseer] ${detail}`);
					updateViewState(projectPath, terminalId, {
						status: "error",
						lastError: detail,
					});
				});
		}, 0);

		return () => {
			disposed = true;
			resizeToContainerRef.current = null;

			if (createSessionTimeoutId !== null) {
				window.clearTimeout(createSessionTimeoutId);
			}

			if (unsubscribeData) {
				unsubscribeData();
			}

			if (unsubscribeExit) {
				unsubscribeExit();
			}

			resizeObserver.disconnect();
			inputDisposable.dispose();

			if (
				activeSessionId &&
				typeof window.overseer?.closeTerminalSession === "function"
			) {
				void window.overseer.closeTerminalSession({
					sessionId: activeSessionId,
				});
			}

			terminal.dispose();
			terminalRef.current = null;
			fitAddonRef.current = null;
		};
	}, [
		command,
		cwd,
		projectPath,
		requestedShell,
		settings,
		terminalId,
		updateViewState,
		reloadNonce,
	]);

	useEffect(() => {
		const terminal = terminalRef.current;
		if (!terminal) {
			return;
		}

		terminal.options.theme = getTerminalTheme(isDark);
	}, [isDark]);

	useEffect(() => {
		const terminal = terminalRef.current;
		if (!terminal) {
			return;
		}

		if (typeof fontSettings.family === "string") {
			terminal.options.fontFamily = fontSettings.family;
		}

		if (typeof fontSettings.size === "number") {
			terminal.options.fontSize = fontSettings.size;
		}

		resizeToContainerRef.current?.();
	}, [fontSettings.family, fontSettings.size]);

	useEffect(() => {
		if (!isActive) {
			return;
		}

		const frameId = window.requestAnimationFrame(() => {
			resizeToContainerRef.current?.();
		});

		return () => {
			window.cancelAnimationFrame(frameId);
		};
	}, [isActive]);

	if (!terminalState) {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center px-8 py-10">
				<p className="text-sm text-text-muted">Terminal state not found.</p>
			</div>
		);
	}

	return (
		<div
			className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
				isDark ? "bg-[#0f172a]" : "bg-white"
			}`}
		>
			{runtimeError ? (
				<div className="border-b border-red-900/70 bg-red-950/60 px-4 py-2 text-xs text-red-300">
					{runtimeError}
				</div>
			) : null}

			<div ref={containerRef} className="min-h-0 flex-1 p-2" />
		</div>
	);
}
