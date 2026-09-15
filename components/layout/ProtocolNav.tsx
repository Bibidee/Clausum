"use client";

import Link from "next/link";
import { Menu, X, WalletCards } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFormation } from "../../lib/formation-context";
import { ProtocolBadge } from "../ui/ProtocolPrimitives";

const links = [{ href: "/workspace", label: "Workspace" }, { href: "/consensus", label: "Consensus" }, { href: "/ratification", label: "Ratification" }, { href: "/receipt", label: "Receipt" }];
export function ProtocolNav() { const pathname = usePathname(); const [open, setOpen] = useState(false); const { wallet, connect } = useFormation(); return <header className="protocol-nav"><Link className="wordmark" href="/"><span className="wordmark-symbol"><i /><i /><b /></span><span>CLAUSUM</span></Link><nav className="desktop-nav">{links.map(link => <Link className={pathname === link.href ? "active" : ""} key={link.href} href={link.href}>{link.label}</Link>)}</nav><div className="nav-actions"><ProtocolBadge tone="live">STUDIO-DEV · 61997</ProtocolBadge><button className="wallet-button" type="button" onClick={() => void connect()}><WalletCards size={15} />{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}</button><button className="mobile-menu" type="button" aria-label="Open navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>{open && <div className="mobile-drawer">{links.map(link => <Link onClick={() => setOpen(false)} className={pathname === link.href ? "active" : ""} key={link.href} href={link.href}>{link.label}</Link>)}<button type="button" onClick={() => void connect()}>Connect wallet</button></div>}</header>; }
