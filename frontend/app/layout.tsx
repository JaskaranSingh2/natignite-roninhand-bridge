import "./globals.css";
import { QueryProvider } from "@/lib/query";
import { ToastProvider } from "@/lib/toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import React from "react";

export const metadata = {
  title: "Bridge UI",
  description: "Signal and Mapping UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-background text-text min-h-screen">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <QueryProvider>
          <ToastProvider>
            <main id="main-content" role="main" className="min-h-screen w-full flex items-center justify-center p-6">
              <div className="w-full max-w-3xl">{children}</div>
            </main>
            <ThemeToggle />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

