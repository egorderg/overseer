import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	root: "src/react",
	plugins: [react()],
	build: {
		outDir: "../../dist/react",
		emptyOutDir: false,
	},
});
