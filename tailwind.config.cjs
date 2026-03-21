/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./index.html",
		"./src/react/**/*.{ts,tsx}",
		"./src/renderer/**/*.ts",
	],
	darkMode: "media",
	theme: {
		extend: {
			colors: {
				primary: "var(--color-primary)",
				"primary-hover": "var(--color-primary-hover)",
				"primary-subtle": "var(--color-primary-subtle)",
				surface: "var(--color-surface)",
				"surface-raised": "var(--color-surface-raised)",
				"surface-muted": "var(--color-surface-muted)",
				border: "var(--color-border)",
				"border-strong": "var(--color-border-strong)",
				text: "var(--color-text)",
				"text-muted": "var(--color-text-muted)",
				"text-subtle": "var(--color-text-subtle)",
				"text-on-raised": "var(--color-text-on-raised)",
			},
			fontFamily: {
				sans: "var(--font-sans)",
			},
		},
	},
	plugins: [],
};
