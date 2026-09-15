import type { Metadata } from "next";
import "./globals.css";
import "./premium.css";
import { AppShell } from "../components/layout/AppShell";

export const metadata: Metadata = {
  title: "CLAUSUM · Semantic Agreement Protocol",
  description: "Two agents. One meaning. Semantic consensus before commitment.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased"><AppShell>{children}</AppShell></body>
    </html>
  );
}
