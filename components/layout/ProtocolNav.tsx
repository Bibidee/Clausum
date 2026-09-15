"use client";

import Link from "next/link";
import { FilePlus2, FolderOpen, Menu, ReceiptText, ShieldCheck, Sparkles, X, WalletCards, Waypoints } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFormation } from "../../lib/formation-context";
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
  const [open, setOpen] = useState(false);
  const { wallet, connect } = useFormation();
  return <header className="protocol-nav">
    <Link className="wordmark" href="/"><span className="wordmark-symbol"><i /><i /><b /></span><span>CLAUSUM</span></Link>
    <nav className="desktop-nav">{links.map(link => <Link className={pathname === link.href ? "active" : ""} key={link.href} href={link.href}>{link.label}</Link>)}</nav>
    <div className="nav-actions"><ProtocolBadge tone="live">STUDIO-DEV · 61997</ProtocolBadge><ThemeToggle /><button className="command-hint" type="button" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}><span>⌘K</span></button><button className="wallet-button" type="button" onClick={() => void connect()}><WalletCards size={15} />{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}</button><button className="mobile-menu" type="button" aria-label="Open navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
    {open && <div className="mobile-drawer">{links.map(link => <Link onClick={() => setOpen(false)} className={pathname === link.href ? "active" : ""} key={link.href} href={link.href}><link.Icon size={15} />{link.label}</Link>)}<Link href="/agreements/new" onClick={() => setOpen(false)}><FilePlus2 size={15} />Create agreement</Link><button type="button" onClick={() => void connect()}><WalletCards size={15} />Connect wallet</button></div>}
  </header>;
}
