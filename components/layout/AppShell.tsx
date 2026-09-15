"use client";

import { ProtocolNav } from "./ProtocolNav";
import { FormationProvider, useFormation } from "../../lib/formation-context";
import { ThemeProvider } from "../theme/ThemeProvider";
import { CommandPalette } from "../ui/CommandPalette";

function ShellContent({ children }: { children: React.ReactNode }) { const { notice } = useFormation(); return <div className="app-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="mesh" /><ProtocolNav /><main>{children}</main><div className="toast" role="status">{notice}</div><CommandPalette /></div>; }
export function AppShell({ children }: { children: React.ReactNode }) { return <ThemeProvider><FormationProvider><ShellContent>{children}</ShellContent></FormationProvider></ThemeProvider>; }
