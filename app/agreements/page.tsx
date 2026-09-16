"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2 } from "lucide-react";
import { AgreementCard, type AgreementCardData } from "../../components/agreements/AgreementCard";
import { ProtocolBadge } from "../../components/ui/ProtocolPrimitives";
import { useFormation } from "../../lib/formation-context";

export default function AgreementsPage() {
  const { agreementId, agreementTitle, partyAName, partyBName, outcome, formed, conflicts } = useFormation();
  const activeStatus = formed ? "Formed" : outcome === "EQUIVALENT" ? "Ready to Ratify" : conflicts.length ? "Conflict" : "Awaiting Consensus";
  const activeAgreement: AgreementCardData = {
    id: agreementId,
    title: agreementTitle,
    parties: `${partyAName} ↔ ${partyBName}`,
    status: activeStatus,
    updated: "Active browser session",
    tone: formed ? "success" : conflicts.length ? "conflict" : "violet",
  };
  return <div className="page"><div className="page-heading"><div><ProtocolBadge tone="live">AGREEMENT LIBRARY</ProtocolBadge><h1>Meaning, organized.</h1><p>Your current browser-session agreement appears here. Durable agreement history is not yet available.</p></div><Link className="button primary" href="/agreements/new"><FilePlus2 size={16} /> New agreement</Link></div><div className="library-grid"><AgreementCard agreement={activeAgreement} /></div><section className="panel timeline-panel"><div className="panel-kicker">ACTIVE PROTOCOL</div><h2>Formation timeline</h2><p>Follow the current agreement from negotiation to proof.</p><Link className="text-link" href="/workspace">Open active workspace <ArrowRight size={15} /></Link></section></div>;
}
