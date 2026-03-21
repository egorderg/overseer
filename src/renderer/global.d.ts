import type { WindowApi } from "../shared/contracts";

declare global {
	interface Window {
		overseer?: WindowApi;
	}
}

export {};
