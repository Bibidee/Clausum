"use client";

import Link from "next/link";
import { Check, Command, Copy, ExternalLink, FilePlus2, FolderOpen, Home, Laptop, Moon, ReceiptText, RotateCcw, Search, ShieldCheck, Sparkles, Sun, WalletCards, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useFormation } from "../../lib/formation-context";
import { useWalletUi } from "../../lib/wallet-context";
import { explorerUrl } from "../../lib/explorer";

type PaletteCommand = { id: string; label: string; hint: string; Icon: typeof Home; href?: string; run?: () => void };

export function CommandPalette() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState("");
  const router = useRouter();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { agreementId, canonicalHash, tx, reset } = useFormation();
  const { openWallet, isConnected } = useWalletUi();
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen(value => !value); } if (event.key === "Escape") setPaletteOpen(false); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  const copy = (value: string, label: string) => { if (!value) return; void navigator.clipboard?.writeText(value); setCopied(label); window.setTimeout(() => setCopied(""), 1200); setPaletteOpen(false); };
  const commands = useMemo<PaletteCommand[]>(() => [
    { id: "overview", label: "Go to Overview", hint: "⌘ ↵", href: "/", Icon: Home }, { id: "agreements", label: "Open Agreement library", hint: "⌘ ↵", href: "/agreements", Icon: FolderOpen }, { id: "new", label: "Create new agreement", hint: "⌘ ↵", href: "/agreements/new", Icon: FilePlus2 }, { id: "workspace", label: "Open Workspace", hint: "⌘ ↵", href: "/workspace", Icon: Search }, { id: "consensus", label: "Open Consensus", hint: "⌘ ↵", href: "/consensus", Icon: Sparkles }, { id: "ratification", label: "Open Ratification", hint: "⌘ ↵", href: "/ratification", Icon: ShieldCheck }, { id: "receipt", label: "Open Formation Receipt", hint: "⌘ ↵", href: "/receipt", Icon: ReceiptText }, { id: "verify", label: "Verify receipt", hint: "⌘ ↵", href: "/verify", Icon: ShieldCheck },
    { id: "theme", label: `Use ${theme === "dark" ? "Luminous Paper" : theme === "light" ? "System theme" : "Midnight Aurora"}`, hint: "⌘ K", Icon: theme === "system" ? Laptop : theme === "dark" ? Sun : Moon, run: () => { toggleTheme(); setPaletteOpen(false); } }, { id: "wallet", label: isConnected ? "Manage wallet" : "Connect wallet", hint: "", Icon: WalletCards, run: () => { openWallet(); setPaletteOpen(false); } }, { id: "copy-id", label: "Copy current agreement ID", hint: agreementId ? "" : "Unavailable", Icon: copied === "agreement ID" ? Check : Copy, run: () => copy(agreementId, "agreement ID") }, { id: "copy-hash", label: "Copy canonical hash", hint: canonicalHash ? "" : "Unavailable", Icon: copied === "canonical hash" ? Check : Copy, run: () => copy(canonicalHash, "canonical hash") }, { id: "explorer", label: "Open GenLayer explorer", hint: tx ? "" : "Unavailable", Icon: ExternalLink, run: () => { if (tx) window.open(explorerUrl("tx", tx), "_blank", "noopener,noreferrer"); setPaletteOpen(false); } }, { id: "reset", label: "Reset workspace demo", hint: "", Icon: RotateCcw, run: () => { reset(); setPaletteOpen(false); } },
  ], [agreementId, canonicalHash, copied, isConnected, openWallet, reset, theme, toggleTheme, tx]);
  const filtered = commands.filter(command => command.label.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => setActive(0), [query]);
  useEffect(() => { if (!paletteOpen) return; const handler = (event: KeyboardEvent) => { if (event.key === "ArrowDown") { event.preventDefault(); setActive(index => Math.min(index + 1, Math.max(0, filtered.length - 1))); } if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => Math.max(index - 1, 0)); } if (event.key === "Enter") { event.preventDefault(); const command = filtered[active]; if (!command) return; setPaletteOpen(false); if (command.href) router.push(command.href); command.run?.(); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [active, filtered, paletteOpen, router]);
  if (!paletteOpen) return null;
  return <div className="command-overlay" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={event => { if (event.target === event.currentTarget) setPaletteOpen(false); }}><div className="command-panel"><div className="command-head"><span><Command size={16} /> Command palette <small>{resolvedTheme} mode</small></span><button className="icon-button" onClick={() => setPaletteOpen(false)} aria-label="Close command palette"><X size={15} /></button></div><div className="command-search"><Search size={15} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search protocol actions…" aria-label="Search commands" /></div><div className="command-list" role="listbox">{filtered.map((command, index) => { const item = <><command.Icon size={15} />{command.label}<kbd>{command.hint}</kbd></>; return command.href ? <Link role="option" aria-selected={index === active} className={index === active ? "active" : ""} key={command.id} href={command.href} onMouseEnter={() => setActive(index)} onClick={() => setPaletteOpen(false)}>{item}</Link> : <button role="option" aria-selected={index === active} className={index === active ? "active" : ""} key={command.id} onMouseEnter={() => setActive(index)} onClick={() => command.run?.()} disabled={command.hint === "Unavailable"}>{item}</button>; })}</div>{filtered.length === 0 && <div className="command-empty">No protocol actions match “{query}”.</div>}<div className="command-footer"><span><kbd>↑↓</kbd> navigate</span><span><kbd>↵</kbd> run</span><span><kbd>esc</kbd> close</span></div></div></div>;
}
