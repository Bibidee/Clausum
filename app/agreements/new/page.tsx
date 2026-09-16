"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormation } from "../../../lib/formation-context";
import type { ObligationModel } from "../../../lib/formation";
import { demoScenarios, deriveConservativeObligations, type DemoScenario } from "../../../lib/demo-scenarios";
import { ProtocolBadge } from "../../../components/ui/ProtocolPrimitives";

export default function NewAgreementPage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [a, setA] = useState("Atlas Procurement");
  const [b, setB] = useState("Meridian Research");
  const [bAddress, setBAddress] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const router = useRouter();
  const { configureDraft, status } = useFormation();
  const submitting = status === "submitting";
  const load = (scenario: DemoScenario) => { setTitle(scenario.title); setText(scenario.text); setSelectedScenario(scenario); };
  const obligations: ObligationModel = selectedScenario?.text === text ? selectedScenario.obligations : deriveConservativeObligations(text);
  return <div className="page"><div className="page-heading centered"><ProtocolBadge tone="violet">NEW AGREEMENT · V2</ProtocolBadge><h1>Start with shared meaning.</h1><p>Shape an agreement object for the guided demo interpretation flow.</p></div><div className="wizard-grid"><form className="form-panel" onSubmit={event => { event.preventDefault(); if (submitting) return; configureDraft({ title, partyAName: a, partyBName: b, partyBAddress: bAddress, obligations }); router.push("/workspace"); }}><div className="form-field"><label htmlFor="title">AGREEMENT TITLE</label><input id="title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. European provider intelligence report" required /></div><div className="form-field"><label htmlFor="party-a">PARTY A</label><input id="party-a" value={a} onChange={event => setA(event.target.value)} /></div><div className="form-field"><label htmlFor="party-b">PARTY B</label><input id="party-b" value={b} onChange={event => setB(event.target.value)} /></div><div className="form-field"><label htmlFor="party-b-address">PARTY B WALLET ADDRESS</label><input id="party-b-address" value={bAddress} onChange={event => setBAddress(event.target.value)} placeholder="0x… (required for onchain formation)" pattern="^0x[a-fA-F0-9]{40}$" title="Enter a 20-byte hexadecimal wallet address." required /></div><div className="form-field"><label htmlFor="agreement-text">NATURAL LANGUAGE AGREEMENT</label><textarea id="agreement-text" value={text} onChange={event => { setText(event.target.value); setSelectedScenario(null); }} placeholder="Describe the obligations both parties should understand…" required /></div><div className="draft-preview"><span>AGREEMENT OBJECT</span><strong>{title || "Untitled agreement"}</strong><small>{text.trim() ? selectedScenario ? `${text.trim().split(/\s+/).length} words · structured demo obligations` : `${text.trim().split(/\s+/).length} words · conservative obligation estimate` : "Add a description to derive the obligation model"}</small></div><button className="button primary" type="submit" disabled={submitting} title={submitting ? "Wait for the current semantic evaluation to finish." : undefined}><FilePlus2 size={16} /> Create and open workspace <ArrowRight size={16} /></button></form><aside className="preview-panel"><ProtocolBadge tone="live"><Sparkles size={13} /> SCENARIO LOADER</ProtocolBadge><h2>Load a guided demo scenario</h2><p>Use a ready-made agreement to move into deterministic comparison.</p><div className="scenario-list">{demoScenarios.map(scenario => <button className="scenario-button" key={scenario.name} type="button" onClick={() => load(scenario)}>{scenario.name}<ArrowRight size={14} /></button>)}</div><Link className="text-link" href="/workspace">Continue with active demo <ArrowRight size={15} /></Link></aside></div></div>;
}

