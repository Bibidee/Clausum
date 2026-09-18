"use client";

import { CheckCircle2, Database, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useFormation } from "../../lib/formation-context";
import { isFormationReceiptConsistent, matchesFormationReceiptQuery } from "../../lib/formation";
import { ExplorerLink, HashDisplay, ProtocolBadge } from "../../components/ui/ProtocolPrimitives";

export default function VerifyPage() {
  const {
    receipt,
    agreementId,
    model,
    canonicalHash,
    evaluationHash,
    verdictHash,
    tx,
    authoritativeRead,
    refreshAuthoritativeState,
    wallet,
  } = useFormation();
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState(false);
  const normalizedQuery = query.trim();
  const receiptConsistent = isFormationReceiptConsistent(receipt, {
    agreementId,
    canonicalHash,
    evaluationHash,
    verdictHash,
    transactionHash: tx,
    contractAddress: process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "",
    network: "Studio-dev",
    policyVersion: model.policyVersion,
  });
  const valid = receiptConsistent && normalizedQuery.length > 0 && matchesFormationReceiptQuery(receipt, normalizedQuery);
  return (
    <div className="page">
      <div className="page-heading centered">
        <ProtocolBadge tone="live">PROOF VERIFICATION</ProtocolBadge>
        <h1>Verify the meaning.</h1>
        <p>Check local receipt consistency, then perform a fresh read from the active Intelligent Contract.</p>
      </div>
      <section className="verify-panel">
        <div className="form-field">
          <label htmlFor="proof-query">RECEIPT ID OR HASH</label>
          <input id="proof-query" value={query} onChange={event => { setQuery(event.target.value); setChecked(false); }} placeholder="AG-… or sha256…" />
        </div>
        <div className="verify-actions">
          <button className="button primary" onClick={() => setChecked(true)}><Search size={16} /> Check local receipt</button>
          <button className="button subtle" onClick={() => void refreshAuthoritativeState()} disabled={!wallet}><Database size={16} /> Read contract state</button>
        </div>
        {checked && (
          <div className={`verify-result ${valid ? "" : "invalid"}`}>
            {valid ? (
              <>
                <CheckCircle2 size={22} className="mint" />
                <ProtocolBadge tone="success">LOCAL RECEIPT · MATCHED</ProtocolBadge>
                <h2>Receipt matches this session.</h2>
                <p>This is a local consistency check only. It does not establish onchain formation.</p>
                <HashDisplay label="CANONICAL HASH" value={receipt.canonicalAgreementHash} compact />
                <HashDisplay label="TRANSACTION" value={receipt.transactionHash} compact />
                <div className="verify-links"><ExplorerLink value={receipt.transactionHash} /><ExplorerLink kind="address" value={receipt.contractAddress} /></div>
              </>
            ) : (
              <>
                <ShieldAlert size={22} className="coral" />
                <h2>No matching local receipt</h2>
                <p>Complete consensus and both ratifications, or enter a receipt value from the current session.</p>
              </>
            )}
          </div>
        )}
        {authoritativeRead && (
          <div className="verify-result authoritative">
            <ProtocolBadge tone={authoritativeRead.state === "FORMED" ? "success" : "violet"}>GENLAYER CONTRACT · {authoritativeRead.state}</ProtocolBadge>
            <h2>Fresh contract readback</h2>
            <p>These values were read from Studio-dev for {agreementId}; they are the authority for formation state.</p>
            <div className="consensus-data">
              <div><small>VERDICT</small><strong>{authoritativeRead.verdict}</strong></div>
              <div><small>CANONICAL HASH</small><HashDisplay value={authoritativeRead.canonicalHash} compact /></div>
              <div><small>PARTY A RATIFIED</small><HashDisplay value={authoritativeRead.partyARatifiedHash} compact /></div>
              <div><small>PARTY B RATIFIED</small><HashDisplay value={authoritativeRead.partyBRatifiedHash} compact /></div>
            </div>
            {tx && <ExplorerLink value={tx} />}
          </div>
        )}
      </section>
    </div>
  );
}
