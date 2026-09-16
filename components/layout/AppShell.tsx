"use client";

import { ProtocolNav } from "./ProtocolNav";
import { FormationProvider, useFormation } from "../../lib/formation-context";
import { ThemeProvider } from "../theme/ThemeProvider";
import { CommandPalette } from "../ui/CommandPalette";
import { CursorLight } from "../ambient/CursorLight";
import { usePathname } from "next/navigation";

function ShellContent({ children }: { children: React.ReactNode }) { const { notice } = useFormation(); const pathname = usePathname(); const routeClass = pathname === "/" ? "overview" : pathname.split("/")[1] || "overview"; return <div className={`app-shell page-${routeClass}`}><div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="mesh" /><CursorLight /><ProtocolNav /><main>{children}</main><div className="toast" role="status">{notice}</div><CommandPalette /></div>; }
export function AppShell({ children }: { children: React.ReactNode }) { return <ThemeProvider><FormationProvider><ShellContent>{children}</ShellContent></FormationProvider></ThemeProvider>; }
