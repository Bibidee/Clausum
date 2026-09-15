import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { ProtocolBadge } from "../ui/ProtocolPrimitives";

export type AgreementCardData = { id: string; title: string; parties: string; status: string; updated: string; tone: "live" | "conflict" | "violet" | "success" };
export function AgreementCard({ agreement }: { agreement: AgreementCardData }) { return <article className="agreement-card"><ProtocolBadge tone={agreement.tone}>{agreement.status.toUpperCase()}</ProtocolBadge><h2>{agreement.title}</h2><p>{agreement.parties}</p><small>{agreement.id}</small><div className="card-foot"><span><Clock3 size={13} /> {agreement.updated}</span><Link className="text-link" href="/workspace">Open <ArrowUpRight size={14} /></Link></div></article>; }
