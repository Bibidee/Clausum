"use client";

import { ProtocolNav } from "./ProtocolNav";
import { FormationProvider, useFormation } from "../../lib/formation-context";

function ShellContent({ children }: { children: React.ReactNode }) { const { notice } = useFormation(); return <div className="app-shell"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="mesh" /><ProtocolNav /><main>{children}</main><div className="toast" role="status">{notice}</div></div>; }
export function AppShell({ children }: { children: React.ReactNode }) { return <FormationProvider><ShellContent>{children}</ShellContent></FormationProvider>; }
