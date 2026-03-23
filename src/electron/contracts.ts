export const IPC_CHANNELS = {
	appInfo: "app:info",
	loadConfig: "config:load",
	getDiff: "git:diff",
	getCurrentBranch: "git:current-branch",
	openInVsCode: "project:open-in-vscode",
	listExplorerFiles: "explorer:list-files",
	readExplorerFile: "explorer:read-file",
} as const;
