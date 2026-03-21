import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
	addWorkspaceProject,
	getWorkspaceFilePath,
	readWorkspaceProjects,
} from "../dist/electron/workspace.js";

async function createTempHome() {
	return fs.mkdtemp(path.join(os.tmpdir(), "overseer-workspace-"));
}

test("readWorkspaceProjects initializes workspace.json when missing", async () => {
	const homeDir = await createTempHome();

	try {
		const projects = await readWorkspaceProjects(homeDir);
		assert.deepEqual(projects, []);

		const workspaceFilePath = getWorkspaceFilePath(homeDir);
		const fileContent = await fs.readFile(workspaceFilePath, "utf8");
		assert.equal(fileContent.trim(), '{\n  "projects": []\n}');
	} finally {
		await fs.rm(homeDir, { recursive: true, force: true });
	}
});

test("addWorkspaceProject persists project with basename label", async () => {
	const homeDir = await createTempHome();
	const projectPath = path.join(homeDir, "projects", "overseer");
	await fs.mkdir(projectPath, { recursive: true });

	try {
		const result = await addWorkspaceProject(projectPath, homeDir);
		assert.equal(result.project.name, "overseer");
		assert.equal(result.projects.length, 1);

		const reloaded = await readWorkspaceProjects(homeDir);
		assert.equal(reloaded.length, 1);
		assert.equal(reloaded[0].name, "overseer");
	} finally {
		await fs.rm(homeDir, { recursive: true, force: true });
	}
});

test("addWorkspaceProject rejects duplicate folder paths", async () => {
	const homeDir = await createTempHome();
	const projectPath = path.join(homeDir, "projects", "workspace-a");
	await fs.mkdir(projectPath, { recursive: true });

	try {
		await addWorkspaceProject(projectPath, homeDir);

		await assert.rejects(
			() => addWorkspaceProject(projectPath, homeDir),
			(error) => error?.code === "duplicate",
		);
	} finally {
		await fs.rm(homeDir, { recursive: true, force: true });
	}
});

test("addWorkspaceProject rejects missing folder paths", async () => {
	const homeDir = await createTempHome();
	const missingPath = path.join(homeDir, "does-not-exist");

	try {
		await assert.rejects(
			() => addWorkspaceProject(missingPath, homeDir),
			(error) => error?.code === "invalid-path",
		);
	} finally {
		await fs.rm(homeDir, { recursive: true, force: true });
	}
});

test("addWorkspaceProject surfaces persistence failures", async () => {
	const homeDir = await createTempHome();
	const projectPath = path.join(homeDir, "projects", "workspace-b");
	await fs.mkdir(projectPath, { recursive: true });

	const workspaceFilePath = getWorkspaceFilePath(homeDir);
	await fs.mkdir(workspaceFilePath, { recursive: true });

	try {
		await assert.rejects(
			() => addWorkspaceProject(projectPath, homeDir),
			(error) => error?.code === "persist-failed",
		);
	} finally {
		await fs.rm(homeDir, { recursive: true, force: true });
	}
});
