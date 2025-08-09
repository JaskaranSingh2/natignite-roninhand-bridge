import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				background: "var(--bg)",
				card: "var(--card)",
				muted: "var(--muted)",
				border: "var(--border)",
				accent: "var(--accent)",
				text: "var(--text)",
				subtext: "var(--subtext)",
				"color-1": "hsl(var(--color-1))",
				"color-2": "hsl(var(--color-2))",
				"color-3": "hsl(var(--color-3))",
				"color-4": "hsl(var(--color-4))",
				"color-5": "hsl(var(--color-5))",
			},
			boxShadow: {
				card: "0 4px 20px rgba(0,0,0,0.3)",
			},
			keyframes: {
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(-4px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				rainbow: {
					"0%": { "background-position": "0%" },
					"100%": { "background-position": "200%" },
				},
			},
			animation: {
				"fade-in": "fade-in 250ms ease-out",
				rainbow: "rainbow var(--speed, 2s) infinite linear",
			},
		},
	},
	plugins: [],
};
export default config;
