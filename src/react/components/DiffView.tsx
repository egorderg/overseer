import { useEffect, useState } from "react";
import type { DiffFile, DiffLine, DiffResult } from "../../shared/contracts";

const EXPANDED_LINE_THRESHOLD = 500;

type ViewState =
	| { status: "loading" }
	| { status: "error"; code: string; message: string }
	| { status: "success"; diff: DiffResult };

function getFileLineCount(file: DiffFile): number {
	return file.hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0);
}

function DiffLineRow({ line }: { line: DiffLine }) {
	const isDelete = line.type === "delete";
	const isAdd = line.type === "add";

	return (
		<div className="flex font-mono text-xs">
			<div
				className={`${isAdd ? "bg-green-500/5" : ""} flex w-1/2 overflow-hidden border-r border-border`}
			>
				<div className="w-12 shrink-0 border-r border-border px-2 py-0.5 text-right text-text-subtle">
					{line.oldNum ?? ""}
				</div>
				<pre
					className={`flex-1 px-3 py-0.5 whitespace-pre ${isDelete ? "bg-red-500/10 text-red-600 dark:text-red-400" : "text-text-muted"}`}
				>
					{isDelete ? line.text : ""}
				</pre>
			</div>
			<div
				className={`${isDelete ? "bg-red-500/5" : ""} flex w-1/2 overflow-hidden`}
			>
				<div className="w-12 shrink-0 border-r border-border px-2 py-0.5 text-right text-text-subtle">
					{line.newNum ?? ""}
				</div>
				<pre
					className={`flex-1 px-3 py-0.5 whitespace-pre ${isAdd ? "bg-green-500/10 text-green-600 dark:text-green-400" : "text-text-muted"}`}
				>
					{isAdd ? line.text : isDelete ? "" : line.text}
				</pre>
			</div>
		</div>
	);
}

function DiffFileBlock({
	file,
	isExpanded,
	onToggle,
}: {
	file: DiffFile;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const statusLabel = () => {
		switch (file.status) {
			case "new":
				return "NEW";
			case "deleted":
				return "DELETED";
			default:
				return `+${file.additions}, -${file.deletions}`;
		}
	};

	const statusColor = () => {
		switch (file.status) {
			case "new":
				return "text-green-600 dark:text-green-400";
			case "deleted":
				return "text-red-600 dark:text-red-400";
			default:
				return "text-text-muted";
		}
	};

	return (
		<div className="border-b border-border last:border-b-0">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between border-b border-border bg-surface-muted px-4 py-2 text-left hover:bg-surface"
			>
				<div className="flex items-center gap-2">
					<span className="text-xs text-text-subtle">
						{isExpanded ? "▼" : "▶"}
					</span>
					<span className="truncate font-mono text-sm text-text">
						{file.path}
					</span>
				</div>
				<span className={`shrink-0 font-mono text-xs ${statusColor()}`}>
					{statusLabel()}
				</span>
			</button>
			{isExpanded && (
				<>
					<div className="flex border-b border-border bg-surface text-xs text-text-subtle">
						<div className="w-1/2 border-r border-border">
							<div className="flex">
								<div className="w-12 shrink-0 border-r border-border px-2 py-1 text-right">
									<span className="opacity-50">#</span>
								</div>
								<div className="flex-1 px-3 py-1 font-medium">HEAD</div>
							</div>
						</div>
						<div className="w-1/2">
							<div className="flex">
								<div className="w-12 shrink-0 border-r border-border px-2 py-1 text-right">
									<span className="opacity-50">#</span>
								</div>
								<div className="flex-1 px-3 py-1 font-medium">WORKING</div>
							</div>
						</div>
					</div>
					<div className="flex flex-col">
						{file.hunks.flatMap((hunk) =>
							hunk.lines.map((line, idx) => (
								<DiffLineRow key={idx} line={line} />
							)),
						)}
					</div>
				</>
			)}
		</div>
	);
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
	const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
		() => new Set(),
	);

	const toggleFile = (path: string) => {
		setExpandedFiles((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	};

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
					setExpandedFiles(
						new Set(
							result.diff.files
								.filter((f) => getFileLineCount(f) <= EXPANDED_LINE_THRESHOLD)
								.map((f) => f.path),
						),
					);
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

	if (state.status === "loading") {
		return <LoadingState />;
	}

	if (state.status === "error") {
		return <ErrorState code={state.code} message={state.message} />;
	}

	if (state.diff.files.length === 0) {
		return <EmptyState />;
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
			{state.diff.files.map((file, idx) => (
				<DiffFileBlock
					key={`${file.path}-${idx}`}
					file={file}
					isExpanded={expandedFiles.has(file.path)}
					onToggle={() => toggleFile(file.path)}
				/>
			))}
		</div>
	);
}
