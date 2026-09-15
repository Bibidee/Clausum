"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

export function ProtocolBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "live" | "conflict" | "success" | "violet" }) { return <span className={`protocol-badge ${tone}`}><i />{children}</span>; }
export function HashDisplay({ label = "SHA-256", value, compact = false }: { label?: string; value: string; compact?: boolean }) { const shown = compact && value ? `${value.slice(0, 10)}…${value.slice(-8)}` : value || "calculating…"; return <code className="hash-display" title={value || undefined}>{label} · {shown}</code>; }
export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) { const [copied, setCopied] = useState(false); return <button className="icon-button" type="button" aria-label={`${label} value`} title={label} disabled={!value} onClick={() => { void navigator.clipboard?.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }}>{copied ? <Check size={15} /> : <Copy size={15} />}<span>{copied ? "Copied" : label}</span></button>; }
export function ExplorerLink({ value, kind = "tx" }: { value: string; kind?: "tx" | "address" }) { if (!value) return null; const href = `https://explorer-studio-next.genlayer.com/${kind}/${value}`; return <a className="external-link" href={href} target="_blank" rel="noreferrer">Explorer <ExternalLink size={13} /></a>; }
