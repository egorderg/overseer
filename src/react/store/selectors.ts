import { useAppStore } from "./store";
import type { ProjectState } from "./types";

export const useProjects = () => useAppStore((state) => state.projects);

export const useProject = (projectPath: string): ProjectState | undefined =>
	useAppStore((state) => state.projects[projectPath]);

export const useLoadConfig = () => useAppStore((state) => state.loadConfig);

export const useToggleProject = () =>
	useAppStore((state) => state.toggleProject);

export const useSelectView = () => useAppStore((state) => state.selectView);

export const useAddTerminal = () => useAppStore((state) => state.addTerminal);

export const useUpdateViewState = () =>
	useAppStore((state) => state.updateViewState);

export const useSelectedProjectPath = () =>
	useAppStore((state) => state.selectedProjectPath);

export const useSelectedView = () => useAppStore((state) => state.selectedView);

export const useTerminalSettings = () =>
	useAppStore((state) => state.terminalSettings);

export const useFontSettings = () => useAppStore((state) => state.fontSettings);

export const useCurrentView = () => {
	const selectedProjectPath = useSelectedProjectPath();
	const selectedView = useSelectedView();
	const projects = useProjects();

	if (!selectedProjectPath || !selectedView) {
		return null;
	}

	const project = projects[selectedProjectPath];
	if (!project) {
		return null;
	}

	return {
		project,
		viewId: selectedView,
	};
};
