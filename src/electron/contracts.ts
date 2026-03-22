export const IPC_CHANNELS = {
	appInfo: "app:info",
	getWorkspaceProjects: "workspace:projects:list",
	addWorkspaceProject: "workspace:projects:add",
	loadConfig: "config:load",
	getDiff: "git:diff",
	getCurrentBranch: "git:current-branch",
} as const;
