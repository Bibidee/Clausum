"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useFormation } from "../../lib/formation-context";
import { InterpretationPanel } from "../../components/agreement/InterpretationPanel";
import { ConvergenceRail } from "../../components/semantic/ConvergenceRail";
import { HashDisplay, ProtocolBadge } from "../../components/ui/ProtocolPrimitives";
import { DiffGraph } from "../../components/semantic/DiffGraph";
import { FormationTimeline } from "../../components/agreement/FormationTimeline";

export default function WorkspacePage() {
  const { agreementId, agreementTitle, stage, conflicts, evaluationHash, evaluationHashStatus, amend, reset, life, status } = useFormation();
  const submitting = status === "submitting";
  return <div className="page workspace-page">
    <div className="page-heading"><div><ProtocolBadge tone="live">WORKSPACE · {agreementId}</ProtocolBadge><h1>Agreement cockpit</h1><p>Compare the two active interpretations and resolve divergence before semantic judgment.</p></div><div className="heading-actions"><span className="state-pill">{life}</span><button className="icon-button" onClick={reset} disabled={submitting} title={submitting ? "Wait for the current evaluation to finish." : "Clear this demo session."}><RotateCcw size={15} />Reset</button></div></div>
    <section className="agreement-banner"><div><small>PROPOSED AGREEMENT</small><h2>{agreementTitle}</h2><p>Guided demo interpretations are compared here before validator judgment and ratification.</p></div><HashDisplay label="EVALUATION INPUT" value={evaluationHash} status={evaluationHashStatus} compact /></section>
    <section className="interpretation-stage"><InterpretationPanel party="a" /><ConvergenceRail /><InterpretationPanel party="b" /></section>
    <section className="workspace-footer"><div><ProtocolBadge tone={conflicts.length ? "conflict" : "success"}>{conflicts.length ? `${conflicts.length} deterministic conflicts` : "Interpretations aligned"}</ProtocolBadge><p>{stage === "conflict" ? "Apply the guided demo amendment to resolve highlighted divergence and create a fresh semantic input." : "The guided interpretations are ready for validator judgment."}</p></div>{stage === "conflict" ? <button className="button primary" onClick={amend} disabled={submitting} title={submitting ? "Wait for the current evaluation to finish." : "Apply the guided demo amendment."}>Apply demo amendment <ArrowRight size={16} /></button> : <Link className="button primary" href="/consensus">Continue to consensus <ArrowRight size={16} /></Link>}</section>
    <section className="workspace-section"><div className="section-heading"><div><span className="eyebrow">SEMANTIC DIFF</span><h2>Where meaning aligns—and where it breaks.</h2></div></div><DiffGraph /></section>
    <section className="workspace-section"><div className="section-heading"><div><span className="eyebrow">FORMATION TIMELINE</span><h2>Protocol state, made visible.</h2></div></div><FormationTimeline /></section>
  </div>;
}
