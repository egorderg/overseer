import { DiffEditor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import type { DiffResult } from "../../shared/contracts";

type ViewState =
	| { status: "loading" }
	| { status: "error"; code: string; message: string }
	| { status: "success"; diff: DiffResult };

function getLanguage(path: string): string | undefined {
	const ext = path.split(".").pop();
	const languageMap: Record<string, string> = {
		ts: "typescript",
		tsx: "typescript",
		js: "javascript",
		jsx: "javascript",
		py: "python",
		rb: "ruby",
		go: "go",
		rs: "rust",
		java: "java",
		c: "c",
		cpp: "cpp",
		h: "c",
		hpp: "cpp",
		cs: "csharp",
		php: "php",
		swift: "swift",
		kt: "kotlin",
		json: "json",
		yaml: "yaml",
		yml: "yaml",
		xml: "xml",
		html: "html",
		css: "css",
		scss: "scss",
		sass: "sass",
		less: "less",
		md: "markdown",
		mdx: "markdown",
		sql: "sql",
		sh: "shell",
		bash: "shell",
		zsh: "shell",
		fish: "shell",
		ps1: "powershell",
		dockerfile: "dockerfile",
		makefile: "makefile",
		toml: "toml",
		ini: "ini",
		cfg: "ini",
		conf: "ini",
		log: "plaintext",
		txt: "plaintext",
	};
	return ext ? languageMap[ext.toLowerCase()] : undefined;
}

function getFileName(filePath: string): string {
	const segments = filePath.split(/[\\/]/);
	return segments[segments.length - 1] ?? filePath;
}

function getDirectoryPath(filePath: string): string {
	const normalizedPath = filePath.replace(/\\/g, "/");
	const lastSeparatorIndex = normalizedPath.lastIndexOf("/");

	if (lastSeparatorIndex === -1) {
		return ".";
	}

	return normalizedPath.slice(0, lastSeparatorIndex);
}

function LoadingState() {
	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10">
			<p className="text-sm text-text-muted">Loading diff...</p>
		</div>
	);
}

function ErrorState({ code, message }: { code: string; message: string }) {
	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10">
			<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
				{code === "not-a-repo" ? "Not a Git Repository" : "Error"}
			</p>
			<p className="mt-3 text-sm text-text-muted">{message}</p>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10">
			<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
				Clean Working Tree
			</p>
			<p className="mt-3 text-sm text-text-muted">
				No uncommitted changes in this project.
			</p>
		</div>
	);
}

export function DiffView({ projectPath }: { projectPath: string }) {
	const [state, setState] = useState<ViewState>({ status: "loading" });
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
	const [isDark, setIsDark] = useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);
	const allFiles = state.status === "success" ? state.diff.files : [];
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const visibleFiles =
		normalizedQuery.length === 0
			? allFiles
			: allFiles.filter((file) =>
					file.path.toLowerCase().includes(normalizedQuery),
				);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	useEffect(() => {
		let isMounted = true;

		async function fetchDiff(): Promise<void> {
			try {
				if (typeof window.overseer?.getDiff !== "function") {
					setState({
						status: "error",
						code: "unavailable",
						message: "Diff is unavailable in the current runtime.",
					});
					return;
				}

				const result = await window.overseer.getDiff(projectPath);

				if (!isMounted) return;

				if (result.ok) {
					setState({ status: "success", diff: result.diff });
				} else {
					setState({
						status: "error",
						code: result.code,
						message: result.error,
					});
				}
			} catch (error) {
				if (!isMounted) return;
				setState({
					status: "error",
					code: "unknown",
					message: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		void fetchDiff();

		return () => {
			isMounted = false;
		};
	}, [projectPath]);

	useEffect(() => {
		if (state.status !== "success") {
			setSelectedFilePath(null);
			return;
		}

		const hasSelection = visibleFiles.some(
			(file) => file.path === selectedFilePath,
		);

		if (!hasSelection) {
			setSelectedFilePath(visibleFiles[0]?.path ?? null);
		}
	}, [state.status, selectedFilePath, visibleFiles]);

	if (state.status === "loading") {
		return <LoadingState />;
	}

	if (state.status === "error") {
		return <ErrorState code={state.code} message={state.message} />;
	}

	if (state.diff.files.length === 0) {
		return <EmptyState />;
	}

	const selectedFile =
		visibleFiles.find((file) => file.path === selectedFilePath) ??
		visibleFiles[0] ??
		null;
	const language = selectedFile ? getLanguage(selectedFile.path) : undefined;

	return (
		<div className="flex min-h-0 flex-1 overflow-hidden">
			<aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
				<div className="border-b border-border">
					<input
						type="text"
						placeholder="Search"
						value={searchQuery}
						onChange={(event) => setSearchQuery(event.target.value)}
						className="w-full rounded-none border-0 bg-surface px-3 py-4 text-xs text-text outline-none placeholder:text-text-subtle"
					/>
				</div>
				{visibleFiles.length === 0 ? (
					<div className="flex min-h-0 flex-1 items-center justify-center px-4 py-6">
						<p className="text-xs text-text-subtle">No matches</p>
					</div>
				) : (
					<ul className="min-h-0 flex-1 overflow-y-auto">
						{visibleFiles.map((file) => {
							const directoryPath = getDirectoryPath(file.path);
							const statusLabel =
								file.status === "added"
									? "A"
									: file.status === "deleted"
										? "D"
										: "M";
							const statusClassName =
								file.status === "added"
									? "bg-green-500/10 text-green-600 dark:text-green-400"
									: file.status === "deleted"
										? "bg-red-500/10 text-red-600 dark:text-red-400"
										: "bg-amber-500/10 text-amber-700 dark:text-amber-400";
							const isSelected = selectedFile.path === file.path;

							return (
								<li key={file.path}>
									<button
										type="button"
										className={`flex w-full items-start gap-2 px-3 py-2 text-left transition ${
											isSelected ? "bg-surface-muted" : "hover:bg-surface-muted"
										}`}
										onClick={() => setSelectedFilePath(file.path)}
									>
										<span
											className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusClassName}`}
										>
											{statusLabel}
										</span>
										<div className="min-w-0 flex-1">
											<span className="block truncate font-mono text-xs text-text">
												{getFileName(file.path)}
											</span>
											<span className="mt-0.5 block truncate font-mono text-[10px] text-text-subtle">
												{directoryPath}
											</span>
										</div>
										<div className="mt-0.5 flex shrink-0 items-center gap-2 font-mono text-[10px]">
											<span className="text-green-600 dark:text-green-400">
												+{file.additions}
											</span>
											<span className="text-red-600 dark:text-red-400">
												-{file.deletions}
											</span>
										</div>
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</aside>

			<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
				{selectedFile === null ? (
					<div className="flex min-h-0 flex-1 items-center justify-center px-8 py-10">
						<p className="text-sm text-text-muted">No file selected.</p>
					</div>
				) : null}

				<div className="min-h-0 flex-1 border-b border-border">
					{selectedFile !== null ? (
						<DiffEditor
							original={selectedFile.original}
							modified={selectedFile.modified}
							language={language}
							theme={isDark ? "vs-dark" : "vs"}
							beforeMount={(monaco) => {
								monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
									{
										noSemanticValidation: false,
										noSyntaxValidation: false,
										diagnosticCodesToIgnore: [7027],
									},
								);
							}}
							options={{
								readOnly: true,
								renderSideBySide: true,
								minimap: { enabled: false },
								scrollBeyondLastLine: false,
								lineNumbers: "on",
								stickyScroll: {
									enabled: false,
								},
								folding: false,
								wordWrap: "off",
								diffWordWrap: "off",
								automaticLayout: true,
								ignoreTrimWhitespace: false,
								renderWhitespace: "selection",
								scrollbar: {
									vertical: "auto",
									horizontal: "auto",
								},
							}}
						/>
					) : null}
				</div>
			</div>
		</div>
	);
}
