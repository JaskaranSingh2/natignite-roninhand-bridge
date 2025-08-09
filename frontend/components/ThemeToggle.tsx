"use client";
import { useEffect, useState } from "react";

import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
	const [theme, setTheme] = useState<"light" | "dark">("dark");

	useEffect(() => {
		const stored =
			(localStorage.getItem("theme") as "light" | "dark" | null) || null;
		const initial =
			stored ||
			(window.matchMedia("(prefers-color-scheme: light)").matches
				? "light"
				: "dark");
		setTheme(initial);
		document.documentElement.setAttribute("data-theme", initial);
	}, []);

	useEffect(() => {
		// keep html[data-theme] in sync if theme state changes via props in future
		document.documentElement.setAttribute("data-theme", theme);
	}, [theme]);

	const toggle = () => {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		localStorage.setItem("theme", next);
	};

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label="Toggle color theme"
			className="fixed top-3 right-3 z-50 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border text-subtext hover:text-text hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-accent/40"
		>
			{theme === "dark" ? (
				<Moon className="w-4 h-4" />
			) : (
				<Sun className="w-4 h-4" />
			)}
			<span className="text-xs font-medium">
				{theme === "dark" ? "Dark" : "Light"}
			</span>
		</button>
	);
}
