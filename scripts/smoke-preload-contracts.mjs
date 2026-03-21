import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const preloadPath = path.join(root, "dist", "electron", "preload.js");
const contractsPath = path.join(root, "dist", "electron", "contracts.js");
const mainPath = path.join(root, "dist", "electron", "main.js");

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

assert(
	fs.existsSync(preloadPath),
	"Missing dist/electron/preload.js. Run build:electron first.",
);
assert(fs.existsSync(contractsPath), "Missing dist/electron/contracts.js.");
assert(fs.existsSync(mainPath), "Missing dist/electron/main.js.");

const preloadContent = fs.readFileSync(preloadPath, "utf8");
const mainContent = fs.readFileSync(mainPath, "utf8");

assert(
	!preloadContent.includes("../shared/contracts"),
	"preload.js still references ../shared/contracts.",
);
assert(
	!preloadContent.includes("./contracts"),
	"preload.js should not require local modules in sandbox mode.",
);
assert(
	preloadContent.includes("getAppInfo"),
	"preload.js does not expose getAppInfo.",
);
assert(
	preloadContent.includes("app:info"),
	"preload.js does not contain the app info IPC channel.",
);
assert(
	mainContent.includes("./contracts"),
	"main.js does not reference the local contracts module.",
);

console.log("Preload contract smoke checks passed.");
