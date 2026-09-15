"use client";

import { LockKeyhole } from "lucide-react";
import { useFormation } from "../../lib/formation-context";
import { HashDisplay, ProtocolBadge } from "../ui/ProtocolPrimitives";

export function CanonicalAgreement() { const { model, canonicalHash, evaluationHash, outcome, agreementId } = useFormation(); return <article className="canonical-object"><div className="canonical-glow" /><div className="object-top"><ProtocolBadge tone="success">CANONICAL OBJECT</ProtocolBadge><LockKeyhole size={17} /></div><h2>One agreed meaning.</h2><p>The canonical agreement is the stable object both parties ratify after semantic judgment.</p><pre>{JSON.stringify(model, null, 2)}</pre><div className="object-data"><span><small>AGREEMENT ID</small><b>{agreementId}</b></span><span><small>VERDICT</small><b className={outcome === "EQUIVALENT" ? "mint" : "amber"}>{outcome}</b></span><span><small>POLICY</small><b>CLAUSUM v{model.policyVersion}</b></span></div><HashDisplay value={canonicalHash} /><HashDisplay label="EVALUATION" value={evaluationHash} compact /></article>; }
