import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				background: "#0b0f1a",
				card: "#0f1729",
				muted: "#1a2236",
				border: "#232b3e",
				accent: "#7c9eff",
				text: "#e5e9f2",
				subtext: "#9aa6bf",
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
