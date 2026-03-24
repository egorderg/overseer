import { Editor } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import type { ExplorerFile } from "../../shared/contracts";

type ExplorerViewProps = {
	projectPath: string;
	explorerPath: string;
	ignore: string[];
};

type ListState =
	| { status: "loading" }
	| { status: "error"; code: string; message: string }
	| { status: "success"; files: ExplorerFile[] };

type ContentState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "error"; code: string; message: string }
	| { status: "success"; content: string };

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

function LoadingState() {
	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10">
			<p className="text-sm text-text-muted">Loading files...</p>
		</div>
	);
}

function ErrorState({ message }: { message: string }) {
	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10">
			<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
				Error
			</p>
			<p className="mt-3 text-sm text-text-muted">{message}</p>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10">
			<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
				No Files Found
			</p>
			<p className="mt-3 text-sm text-text-muted">
				This explorer path does not contain readable files.
			</p>
		</div>
	);
}

export function ExplorerView({
	projectPath,
	explorerPath,
	ignore,
}: ExplorerViewProps) {
	const [listState, setListState] = useState<ListState>({ status: "loading" });
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
	const [contentState, setContentState] = useState<ContentState>({
		status: "idle",
	});
	const [isDark, setIsDark] = useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);
	const allFiles = listState.status === "success" ? listState.files : [];
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const visibleFiles =
		normalizedQuery.length === 0
			? allFiles
			: allFiles.filter((file) => {
					const searchableText =
						`${file.name} ${file.directory} ${file.path}`.toLowerCase();
					return searchableText.includes(normalizedQuery);
				});

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (event: MediaQueryListEvent) => setIsDark(event.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	useEffect(() => {
		let isMounted = true;

		async function fetchFiles(): Promise<void> {
			if (typeof window.overseer?.listExplorerFiles !== "function") {
				setListState({
					status: "error",
					code: "unavailable",
					message: "Explorer is unavailable in the current runtime.",
				});
				return;
			}

			try {
				setListState({ status: "loading" });
				const result = await window.overseer.listExplorerFiles(
					projectPath,
					explorerPath,
					ignore,
				);

				if (!isMounted) {
					return;
				}

				if (result.ok) {
					setListState({ status: "success", files: result.files });
					return;
				}

				setListState({
					status: "error",
					code: result.code,
					message: result.error,
				});
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setListState({
					status: "error",
					code: "unknown",
					message: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		void fetchFiles();

		return () => {
			isMounted = false;
		};
	}, [projectPath, explorerPath, ignore]);

	useEffect(() => {
		if (listState.status !== "success") {
			setSelectedFilePath(null);
			setContentState({ status: "idle" });
			return;
		}

		const hasSelection = visibleFiles.some(
			(file) => file.path === selectedFilePath,
		);

		if (hasSelection) {
			return;
		}

		setSelectedFilePath(visibleFiles[0]?.path ?? null);
	}, [listState.status, selectedFilePath, visibleFiles]);

	useEffect(() => {
		let isMounted = true;

		async function fetchFileContent(): Promise<void> {
			if (!selectedFilePath) {
				setContentState({ status: "idle" });
				return;
			}

			if (typeof window.overseer?.readExplorerFile !== "function") {
				setContentState({
					status: "error",
					code: "unavailable",
					message: "File preview is unavailable in the current runtime.",
				});
				return;
			}

			try {
				setContentState({ status: "loading" });
				const result = await window.overseer.readExplorerFile(
					projectPath,
					explorerPath,
					selectedFilePath,
				);

				if (!isMounted) {
					return;
				}

				if (result.ok) {
					setContentState({ status: "success", content: result.content });
					return;
				}

				setContentState({
					status: "error",
					code: result.code,
					message: result.error,
				});
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setContentState({
					status: "error",
					code: "unknown",
					message: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		void fetchFileContent();

		return () => {
			isMounted = false;
		};
	}, [projectPath, explorerPath, selectedFilePath]);

	if (listState.status === "loading") {
		return <LoadingState />;
	}

	if (listState.status === "error") {
		return <ErrorState message={listState.message} />;
	}

	if (listState.files.length === 0) {
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
							const isSelected = selectedFile.path === file.path;

							return (
								<li key={file.path}>
									<button
										type="button"
										className={`w-full px-3 py-2 text-left transition ${
											isSelected ? "bg-surface-muted" : "hover:bg-surface-muted"
										}`}
										onClick={() => setSelectedFilePath(file.path)}
									>
										<span className="block truncate font-mono text-xs text-text">
											{file.name}
										</span>
										<span className="mt-0.5 block truncate font-mono text-[10px] text-text-subtle">
											{file.directory}
										</span>
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

				{contentState.status === "loading" ? (
					<div className="flex min-h-0 flex-1 items-center justify-center px-8 py-10">
						<p className="text-sm text-text-muted">Loading file...</p>
					</div>
				) : null}

				{contentState.status === "error" ? (
					<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-10">
						<p className="text-xs uppercase tracking-[0.2em] text-text-subtle">
							Unable to Preview File
						</p>
						<p className="mt-3 text-sm text-text-muted">
							{contentState.message}
						</p>
					</div>
				) : null}

				{contentState.status === "success" && selectedFile !== null ? (
					<Editor
						value={contentState.content}
						language={language}
						theme={isDark ? "vs-dark" : "vs"}
						options={{
							readOnly: true,
							minimap: { enabled: false },
							scrollBeyondLastLine: false,
							lineNumbers: "on",
							stickyScroll: {
								enabled: false,
							},
							folding: false,
							wordWrap: "off",
							automaticLayout: true,
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
	);
}
