"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormation } from "../../../lib/formation-context";
import type { ObligationModel } from "../../../lib/formation";
import { ProtocolBadge } from "../../../components/ui/ProtocolPrimitives";

const scenarios = [{ name: "Procurement agreement", title: "European provider intelligence report", text: "Produce a competitor report covering the five largest European providers, using public sources, by Friday at 17:00." }, { name: "Research / reporting", title: "Quarterly market brief", text: "Prepare a concise market brief with cited sources and deliver it by the end of the quarter." }, { name: "Freelance delivery", title: "Product launch package", text: "Deliver the launch package with design files, copy, and a review call within ten business days." }, { name: "Agent service", title: "Agent-to-agent service", text: "Monitor a service endpoint, report anomalies, and escalate verified incidents within one hour." }];

export default function NewAgreementPage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [a, setA] = useState("Atlas Procurement");
  const [b, setB] = useState("Meridian Research");
  const router = useRouter();
  const { configureDraft, status } = useFormation();
  const submitting = status === "submitting";
  const load = (scenario: typeof scenarios[number]) => { setTitle(scenario.title); setText(scenario.text); };
  const deriveObligations = (description: string): ObligationModel => {
    const lower = description.toLowerCase();
    const quantityMatch = description.match(/\b(\d+)\b/);
    return { scope: description.split(",")[0]?.trim() || "mutually defined scope", evidence: lower.includes("source") ? "independent public sources" : "evidence agreed by both parties", deadline: lower.match(/by [^,.]+/i)?.[0] || "deadline agreed by both parties", quantity: quantityMatch ? Number(quantityMatch[1]) : 1 };
  };
  return <div className="page"><div className="page-heading centered"><ProtocolBadge tone="violet">NEW AGREEMENT · V2</ProtocolBadge><h1>Start with shared meaning.</h1><p>Shape an agreement object for the guided demo interpretation flow.</p></div><div className="wizard-grid"><form className="form-panel" onSubmit={event => { event.preventDefault(); if (submitting) return; configureDraft({ title, partyAName: a, partyBName: b, obligations: deriveObligations(text) }); router.push("/workspace"); }}><div className="form-field"><label htmlFor="title">AGREEMENT TITLE</label><input id="title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. European provider intelligence report" required /></div><div className="form-field"><label htmlFor="party-a">PARTY A</label><input id="party-a" value={a} onChange={event => setA(event.target.value)} /></div><div className="form-field"><label htmlFor="party-b">PARTY B</label><input id="party-b" value={b} onChange={event => setB(event.target.value)} /></div><div className="form-field"><label htmlFor="agreement-text">NATURAL LANGUAGE AGREEMENT</label><textarea id="agreement-text" value={text} onChange={event => setText(event.target.value)} placeholder="Describe the obligations both parties should understand…" required /></div><div className="draft-preview"><span>AGREEMENT OBJECT</span><strong>{title || "Untitled agreement"}</strong><small>{text.trim() ? `${text.trim().split(/\s+/).length} words · obligation model ready` : "Add a description to derive the obligation model"}</small></div><button className="button primary" type="submit" disabled={submitting} title={submitting ? "Wait for the current semantic evaluation to finish." : undefined}><FilePlus2 size={16} /> Create and open workspace <ArrowRight size={16} /></button></form><aside className="preview-panel"><ProtocolBadge tone="live"><Sparkles size={13} /> SCENARIO LOADER</ProtocolBadge><h2>Load a guided demo scenario</h2><p>Use a ready-made agreement to move into deterministic comparison.</p><div className="scenario-list">{scenarios.map(scenario => <button className="scenario-button" key={scenario.name} type="button" onClick={() => load(scenario)}>{scenario.name}<ArrowRight size={14} /></button>)}</div><Link className="text-link" href="/workspace">Continue with active demo <ArrowRight size={15} /></Link></aside></div></div>;
}
