const appNameElement = document.getElementById("app-name");
const appVersionElement = document.getElementById("app-version");

async function renderAppInfo(): Promise<void> {
	if (!appNameElement || !appVersionElement) {
		return;
	}

	if (typeof window.overseer?.getAppInfo !== "function") {
		console.error(
			"[renderer] Preload API unavailable: expected window.overseer.getAppInfo().",
		);
		appNameElement.textContent = "Overseer";
		appVersionElement.textContent = "App API unavailable";
		return;
	}

	try {
		const info = await window.overseer.getAppInfo();
		appNameElement.textContent = info.name;
		appVersionElement.textContent = `${info.version} (${info.platform})`;
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		console.error("[renderer] Failed to fetch app info from preload bridge.", {
			detail,
		});
		appVersionElement.textContent = "App info unavailable";
	}
}

void renderAppInfo();
