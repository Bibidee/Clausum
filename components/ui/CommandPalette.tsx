"use client";

import Link from "next/link";
import { Command, FilePlus2, FolderOpen, Home, Moon, ReceiptText, Search, ShieldCheck, Sparkles, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";

const commands = [
  ["Overview", "/", Home], ["Agreement library", "/agreements", FolderOpen], ["New agreement", "/agreements/new", FilePlus2],
  ["Workspace", "/workspace", Search], ["Consensus", "/consensus", Sparkles], ["Ratification", "/ratification", ShieldCheck], ["Receipt", "/receipt", ReceiptText], ["Verify receipt", "/verify", ShieldCheck],
] as const;

export function CommandPalette() { const [open, setOpen] = useState(false); const { theme, toggleTheme } = useTheme(); useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(value => !value); } if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []); if (!open) return null; return <div className="command-overlay" role="dialog" aria-modal="true" aria-label="Command palette"><div className="command-panel"><div className="command-head"><span><Command size={16} /> Command palette</span><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close command palette"><X size={15} /></button></div><div className="command-search"><Search size={15} /><input autoFocus placeholder="Jump to a protocol surface…" /></div><div className="command-list">{commands.map(([label, href, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)}><Icon size={15} />{label}<kbd>↵</kbd></Link>)}<button onClick={() => { toggleTheme(); setOpen(false); }}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}Switch to {theme === "dark" ? "Luminous Paper" : "Midnight Aurora"}<kbd>⌘K</kbd></button></div></div></div>; }
