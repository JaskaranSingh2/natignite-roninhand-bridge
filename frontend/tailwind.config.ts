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
			},
			boxShadow: {
				card: "0 4px 20px rgba(0,0,0,0.3)",
			},
			keyframes: {
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(-4px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
			},
			animation: {
				"fade-in": "fade-in 250ms ease-out",
			},
		},
	},
	plugins: [],
};
export default config;
