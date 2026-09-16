"use client";

import Link from "next/link";
import { FilePlus2, FolderOpen, Menu, ReceiptText, ShieldCheck, Sparkles, X, WalletCards, Waypoints } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormation } from "../../lib/formation-context";
import { useWalletUi } from "../../lib/wallet-context";
import { ThemeToggle } from "../theme/ThemeToggle";
import { ProtocolBadge } from "../ui/ProtocolPrimitives";

const links = [
  { href: "/", label: "Overview", Icon: Sparkles },
  { href: "/agreements", label: "Agreements", Icon: FolderOpen },
  { href: "/workspace", label: "Workspace", Icon: Waypoints },
  { href: "/consensus", label: "Consensus", Icon: Sparkles },
  { href: "/ratification", label: "Ratification", Icon: ShieldCheck },
  { href: "/receipt", label: "Receipt", Icon: ReceiptText },
];

export function ProtocolNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { wallet } = useFormation();
  const { openWallet, address, isConnected } = useWalletUi();
  useEffect(() => { if (!mobileOpen) return; const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [mobileOpen]);
  return <header className="protocol-nav">
    <Link className="wordmark" href="/"><span className="wordmark-symbol"><i /><i /><b /></span><span>CLAUSUM</span></Link>
    <nav className="desktop-nav">{links.map(link => <Link className={pathname === link.href ? "active" : ""} key={link.href} href={link.href}>{link.label}</Link>)}</nav>
    <div className="nav-actions"><ProtocolBadge tone="live">STUDIO-DEV · 61997</ProtocolBadge><ThemeToggle /><button className="command-hint" type="button" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}><span>⌘K</span></button><button className="wallet-button" type="button" onClick={openWallet}><WalletCards size={15} />{wallet || address ? `${(wallet || address || "").slice(0, 6)}…${(wallet || address || "").slice(-4)}` : "Connect wallet"}</button><button className="mobile-menu" type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="mobile-nav-drawer" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button></div>
    {mobileOpen && <div className="mobile-drawer" id="mobile-nav-drawer">{links.map(link => <Link onClick={() => setMobileOpen(false)} className={pathname === link.href ? "active" : ""} key={link.href} href={link.href}><link.Icon size={15} />{link.label}</Link>)}<Link href="/agreements/new" onClick={() => setMobileOpen(false)}><FilePlus2 size={15} />Create agreement</Link><button type="button" onClick={() => { openWallet(); setMobileOpen(false); }}><WalletCards size={15} />{isConnected ? "Manage wallet" : "Connect wallet"}</button></div>}
  </header>;
}
