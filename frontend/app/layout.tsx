import "./globals.css";
import { QueryProvider } from "@/lib/query";
import { ToastProvider } from "@/lib/toast";
import React from "react";

export const metadata = {
	title: "Bridge UI",
	description: "Signal and Mapping UI",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="bg-background text-text min-h-screen">
				<QueryProvider>
					<ToastProvider>
						<div className="min-h-screen w-full flex items-center justify-center p-6">
							<div className="w-full max-w-3xl">{children}</div>
						</div>
					</ToastProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
