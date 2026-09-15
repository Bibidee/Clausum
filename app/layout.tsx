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
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const saved = localStorage.getItem("clausum-theme"); const theme = saved === "light" || saved === "dark" ? saved : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"); document.documentElement.dataset.theme = theme; } catch (_) {} })();`,
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
