"use client";

import { useEffect, useMemo, useState } from "react";
import { connectStudioDev, submitConsensus, type Eip1193Provider } from "../lib/genlayer";
import { canForm, canonicalHash, createFormationReceipt, deterministicConflicts, evaluationInputHash, stableStringify, type FormationReceipt, type ObligationModel, type SemanticOutcome } from "../lib/formation";

const QUESTION = "Do these interpretations establish materially equivalent obligations?";
const POLICY_VERSION = "0.1";
const fields = [["SCOPE", "Five largest EU providers by revenue", "Five largest EU providers by revenue", "MATCH"], ["EVIDENCE", "Two independent public sources", "One public source", "CONFLICT"], ["DEADLINE", "Friday · 17:00 CET", "Friday · 17:00 UTC", "CONFLICT"], ["QUANTITY", "5 providers", "5 providers", "SEMANTIC REVIEW"]] as const;
const makeDemoId = () => `AG-${Date.now().toString(36).toUpperCase()}`;
const Mark = () => <span className="mark"><i /><i /><b /></span>;
const Hash = ({ v }: { v: string }) => <code className="hash">SHA-256 · {v || "calculating…"}</code>;

export default function Home() {
  const [id, setId] = useState("AG-DEMO");
  const [stage, setStage] = useState<"conflict" | "ready">("conflict");
  const [outcome, setOutcome] = useState<SemanticOutcome>("UNRESOLVED");
  const [input, setInput] = useState("");
  const [hash, setHash] = useState("");
  const [verdictHash, setVerdictHash] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "finalized" | "error">("idle");
  const [tx, setTx] = useState("");
  const [approved, setApproved] = useState<{ a: string; b: string }>({ a: "", b: "" });
  const [receipt, setReceipt] = useState<FormationReceipt | null>(null);
  const [notice, setNotice] = useState("Agreement workspace ready.");

  const model = useMemo(() => ({ parties: ["Atlas Procurement", "Meridian Research"], obligations: { scope: "five largest EU providers by revenue", evidence: "two independent public sources", deadline: "Friday 17:00 CET", quantity: 5 }, policyVersion: POLICY_VERSION }), []);
  const partyAObligations = model.obligations;
  const partyBObligations = useMemo<ObligationModel>(() => stage === "conflict" ? { scope: "five largest EU providers by revenue", evidence: "one public source", deadline: "Friday 17:00 UTC", quantity: 5 } : model.obligations, [model, stage]);
  const partyA = useMemo(() => stableStringify(partyAObligations), [partyAObligations]);
  const partyB = useMemo(() => stableStringify(partyBObligations), [partyBObligations]);
  const data = useMemo(() => ({ agreementId: id, partyA, partyB, question: QUESTION, policyVersion: POLICY_VERSION }), [id, partyA, partyB]);
  useEffect(() => { void canonicalHash(model).then(setHash); void evaluationInputHash(data).then(setInput); }, [data, model]);

  const conflicts = useMemo(() => deterministicConflicts(partyAObligations, partyBObligations), [partyAObligations, partyBObligations]);
  const ready = canForm(outcome, conflicts, hash, hash, input, verdictHash);
  const formed = canForm(outcome, conflicts, approved.a, approved.b, input, verdictHash);
  const life = formed ? "FORMED" : ready ? "READY FOR RATIFICATION" : conflicts.length ? "CONFLICT" : "SEMANTIC REVIEW";
  const contractAddress = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";

  const clearRuntime = () => { setOutcome("UNRESOLVED"); setVerdictHash(""); setTx(""); setStatus("idle"); setApproved({ a: "", b: "" }); setReceipt(null); };
  const amend = () => { setStage("ready"); clearRuntime(); setNotice("Interpretations changed. Previous semantic verdict invalidated."); };
  const reset = () => { setId(makeDemoId()); setStage("conflict"); clearRuntime(); setNotice("Agreement workspace ready."); };
  const connect = async () => { try { const provider = (window as unknown as { ethereum?: Eip1193Provider }).ethereum; if (!provider) throw new Error("No compatible browser wallet is available."); const result = await connectStudioDev(provider); setWallet(result.account); setNotice("Wallet connected to Studio-dev · 61997."); } catch (error) { setNotice(error instanceof Error ? error.message : "Wallet connection failed."); } };
  const evaluate = async () => { const address = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS as `0x${string}` | undefined; const provider = (window as unknown as { ethereum?: Eip1193Provider }).ethereum; if (!address) { setNotice("A fresh Studio Next contract address is required before semantic evaluation."); return; } if (!provider) { setNotice("Connect a Studio-dev wallet before evaluating meaning."); return; } try { setStatus("submitting"); setNotice("Submitting semantic question to GenLayer validators…"); const result = await submitConsensus(provider, address, { agreementId: id, inputHash: input, buyerInterpretation: partyA, sellerInterpretation: partyB, question: QUESTION }); setOutcome(result.outcome); setVerdictHash(input); setTx(result.transactionHash); setStatus("finalized"); setNotice(result.outcome === "EQUIVALENT" ? "Validator consensus established material equivalence." : "Formation is blocked until these obligations converge."); } catch (error) { setStatus("error"); setNotice(error instanceof Error ? error.message : "GenLayer transaction failed."); } };
  const ratify = (party: string) => {
    if (!ready) return;
    const next = party === "Atlas Procurement" ? { ...approved, a: hash } : { ...approved, b: hash };
    setApproved(next);
    if (next.a === hash && next.b === hash && outcome === "EQUIVALENT" && tx && input === verdictHash) {
      setReceipt(createFormationReceipt({ agreementId: id, canonicalAgreementHash: hash, evaluationInputHash: verdictHash, verdict: outcome, transactionHash: tx, contractAddress, network: "Studio-dev", partyARatifiedHash: next.a, partyBRatifiedHash: next.b, policyVersion: POLICY_VERSION, formedAt: new Date().toISOString() }));
    }
    setNotice(`${party} ratified the exact canonical hash.`);
  };

  return <main className={`app-shell ${stage} ${outcome.toLowerCase()}`}><div className="grid" /><header><a className="brand" href="#workspace"><Mark />CLAUSUM</a><nav><a href="#workspace">Workspace</a><a href="#consensus">Consensus</a><a href="#ratification">Ratification</a><a href="#receipt">Receipt</a></nav><div className="network"><i />STUDIO DEV · 61997<button onClick={connect}>{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}</button></div></header>
    <section className="hero" id="workspace"><div><p>AUTONOMOUS AGREEMENT FORMATION</p><h1>Two agents.<br /><em>One meaning.</em></h1><span>CLAUSUM compares independently interpreted obligations before autonomous parties commit value.</span></div><aside><b>{id}</b><strong>{life}</strong><button onClick={reset}>Reset scenario</button></aside></section>
    <section className="agreement surface"><p>PROPOSED AGREEMENT</p><h2>European provider intelligence report</h2><span>Produce a competitor report covering the five largest European providers, using public sources, by Friday at 17:00.</span><footer>PARTY A · Atlas Procurement　 PARTY B · Meridian Research　 POLICY · CLAUSUM v0.1 <Hash v={hash} /></footer></section>
    <section className="parties"><article className="surface party a"><p>PARTY A · BUYER</p><h2>Atlas Procurement</h2>{fields.map(([key, a]) => <div key={key}><b>{key}</b><span>{a}</span></div>)}</article><div className="rails"><i /><i /><div><Mark /><b>{status === "submitting" ? "…" : outcome === "EQUIVALENT" ? "✓" : outcome === "MATERIAL_CONFLICT" ? "×" : "?"}</b><span>SEMANTIC NODE</span></div><i /><i /><small>DIVERGENCE → JUDGMENT → CONVERGENCE</small></div><article className="surface party b"><p>PARTY B · SELLER</p><h2>Meridian Research</h2>{fields.map(([key, a, b]) => <div className={stage === "conflict" && a !== b ? "mismatch" : ""} key={key}><b>{key}</b><span>{stage === "conflict" ? b : a}</span></div>)}</article></section>
    <section className="surface comparison"><p>DETERMINISTIC COMPARISON</p><h2>Where meaning aligns — and where it breaks.</h2>{fields.map(([key, a, b, label]) => { const bad = conflicts.includes(key.toLowerCase()); return <div className={bad ? "row bad" : "row"} key={key}><b>{key}</b><span>{a}</span><i>{bad ? "×" : "●"}</i><span>{stage === "conflict" ? b : a}</span><em>{bad ? "DETERMINISTIC CONFLICT" : label}</em></div>; })}{stage === "conflict" && <button className="secondary" onClick={amend}>Apply amendment</button>}</section>
    <section className="surface consensus" id="consensus"><p>GENLAYER SEMANTIC CONSENSUS</p><h2>Meaning, submitted for validator judgment.</h2><div><Hash v={input} /><span>NETWORK · Studio-dev 61997</span><span>TX · {tx ? `${tx.slice(0, 14)}…` : "Not submitted"}</span></div><aside><strong>{status === "submitting" ? "Validators are resolving semantic equivalence." : outcome === "EQUIVALENT" ? "Shared meaning established." : outcome === "MATERIAL_CONFLICT" ? "Material conflict remains." : "Meaning has not been evaluated on GenLayer."}</strong><button disabled={status === "submitting"} onClick={evaluate}>{status === "submitting" ? "Submitting semantic question…" : "Evaluate meaning"}</button></aside></section>
    <section className="formation" id="ratification"><article className="surface canonical"><Mark /><p>CANONICAL AGREEMENT</p><h2>Two interpretations.<br />One agreed object.</h2><pre>{stableStringify(model)}</pre><Hash v={hash} /></article><article className="surface ratification"><p>RATIFICATION</p><h2>Approve the one canonical hash.</h2>{["Atlas Procurement", "Meridian Research"].map(party => { const isRatified = party === "Atlas Procurement" ? approved.a === hash : approved.b === hash; return <div key={party}><span>{party}<small>{isRatified ? "Ratified exact hash" : "Awaiting approval"}</small></span><button disabled={!ready || isRatified} onClick={() => ratify(party)}>{isRatified ? "Ratified" : "Ratify"}</button></div>; })}<em>{formed ? "MATCHING RATIFICATIONS" : "Both parties must approve this exact canonical hash."}</em></article></section>
    <section className={`surface receipt ${formed ? "issued" : ""}`} id="receipt"><Mark /><p>FORMATION RECEIPT · PROTOCOL VERIFICATION</p><h2>{receipt ? "AGREEMENT FORMED" : "RECEIPT PENDING"}</h2><span>{receipt ? "The same canonical agreement received an equivalent verdict and matching approvals." : "Receipt becomes available after semantic equivalence and matching ratification."}</span>{receipt ? <div className="receipt-values"><code>Agreement ID · {receipt.agreementId}</code><Hash v={receipt.canonicalAgreementHash} /><code>Evaluation input · {receipt.evaluationInputHash}</code><code>Verdict · {receipt.verdict}</code><code>Transaction · {receipt.transactionHash}</code><code>Contract · {receipt.contractAddress}</code><code>Network · {receipt.network}</code><code>Party A ratified · {receipt.partyARatifiedHash}</code><code>Party B ratified · {receipt.partyBRatifiedHash}</code><code>Policy · CLAUSUM v{receipt.policyVersion}</code><code>Formed · {receipt.formedAt}</code></div> : <Hash v={hash} />}</section><div className="toast" role="status">{notice}</div></main>;
}
