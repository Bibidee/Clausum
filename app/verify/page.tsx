"use client";

import { CheckCircle2, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useFormation } from "../../lib/formation-context";
import { isFormationReceiptConsistent } from "../../lib/formation";
import { ExplorerLink, HashDisplay, ProtocolBadge } from "../../components/ui/ProtocolPrimitives";

export default function VerifyPage() {
  const { receipt, agreementId, model, canonicalHash, evaluationHash, verdictHash, tx } = useFormation();
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState(false);
  const receiptConsistent = isFormationReceiptConsistent(receipt, { agreementId, canonicalHash, evaluationHash, verdictHash, transactionHash: tx, contractAddress: process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "", network: "Studio-dev", policyVersion: model.policyVersion });
  const valid = receiptConsistent && (!query || query === receipt.agreementId || query === receipt.canonicalAgreementHash || query === receipt.transactionHash);
  return <div className="page"><div className="page-heading centered"><ProtocolBadge tone="live">PROOF VERIFICATION</ProtocolBadge><h1>Verify the meaning.</h1><p>Inspect a Formation Receipt from this browser session or paste its agreement ID, canonical hash, or transaction.</p></div><section className="verify-panel"><div className="form-field"><label htmlFor="proof-query">RECEIPT ID OR HASH</label><input id="proof-query" value={query} onChange={event => { setQuery(event.target.value); setChecked(false); }} placeholder="AG-… or sha256…" /></div><button className="button primary" onClick={() => setChecked(true)}><Search size={16} /> Check local receipt</button>{checked && <div className={`verify-result ${valid ? "" : "invalid"}`}>{valid ? <><CheckCircle2 size={22} className="mint" /><ProtocolBadge tone="success">LOCAL RECEIPT · MATCHED</ProtocolBadge><h2>Receipt matches this session.</h2><p>This browser receipt is internally consistent with the current canonical hash, ratifications, verdict, and transaction. GenLayer readback is not performed by this page; use the explorer links for network evidence.</p><HashDisplay label="CANONICAL HASH" value={receipt.canonicalAgreementHash} compact /><HashDisplay label="TRANSACTION" value={receipt.transactionHash} compact /><div className="verify-links"><ExplorerLink value={receipt.transactionHash} /><ExplorerLink kind="address" value={receipt.contractAddress} /></div></> : <><ShieldAlert size={22} className="coral" /><h2>No matching local receipt</h2><p>Complete semantic consensus and matching ratification in this browser session, then check the resulting agreement ID, canonical hash, or transaction.</p></>}</div>}</section></div>;
}
