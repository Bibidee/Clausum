import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { ProtocolBadge } from "../ui/ProtocolPrimitives";

export type AgreementCardData = { id: string; title: string; parties: string; status: string; updated: string; tone: "live" | "conflict" | "violet" | "success" };
export function AgreementCard({ agreement }: { agreement: AgreementCardData }) { const state = agreement.tone === "success" ? "formed" : agreement.tone === "conflict" ? "conflict" : agreement.tone === "live" ? "draft" : "awaiting"; return <article className={`agreement-card state-${state}`}><div className="agreement-state-visual" aria-hidden="true"><span /><i /><b /></div><ProtocolBadge tone={agreement.tone}>{agreement.status.toUpperCase()}</ProtocolBadge><h2>{agreement.title}</h2><p>{agreement.parties}</p><small>{agreement.id}</small><div className="card-foot"><span><Clock3 size={13} /> {agreement.updated}</span><Link className="text-link" href="/workspace">Open <ArrowUpRight size={14} /></Link></div></article>; }
