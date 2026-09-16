"use client";

import { ProtocolNav } from "./ProtocolNav";
import { FormationProvider, useFormation } from "../../lib/formation-context";
import { ThemeProvider } from "../theme/ThemeProvider";
import { CommandPalette } from "../ui/CommandPalette";
import { CursorLight } from "../ambient/CursorLight";
import { usePathname } from "next/navigation";
import { lazy, Suspense, useSyncExternalStore } from "react";

const WalletRuntime = lazy(() => import("../wallet/WalletRuntime").then(module => ({ default: module.WalletRuntime })));

function ShellContent({ children }: { children: React.ReactNode }) { const { notice } = useFormation(); const pathname = usePathname(); const routeClass = pathname === "/" ? "overview" : pathname.split("/")[1] || "overview"; return <div className={`app-shell page-${routeClass}`}><div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="mesh" /><CursorLight /><ProtocolNav /><main>{children}</main><div className="toast" role="status">{notice}</div><CommandPalette /></div>; }
export function AppShell({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  return <ThemeProvider><FormationProvider><Suspense fallback={null}>{mounted ? <WalletRuntime><ShellContent>{children}</ShellContent></WalletRuntime> : null}</Suspense></FormationProvider></ThemeProvider>;
}
