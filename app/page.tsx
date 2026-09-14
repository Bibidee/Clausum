"use client";
import { useMemo, useState } from "react";
import { connectStudioDev, submitConsensus } from "../lib/genlayer";

type Stage = "conflict" | "ready";
const fields = [
  ["Largest providers", "Annual revenue", "Market share"],
  ["European", "EU headquartered", "Substantial European operations"],
  ["Evidence", "2 independent public sources", "1 public source"],
  ["Deadline", "Friday, 17:00 CET", "Friday, 17:00 UTC"],
];
function Hash({value}:{value:string}) { return <code className="hash">{value}</code>; }

export default function Home() {
  const [stage, setStage] = useState<Stage>("conflict");
  const [ratified, setRatified] = useState<string[]>([]);
  const [notice, setNotice] = useState("Demo workspace loaded");
  const [wallet, setWallet] = useState<string | null>(null);
  const [chainStatus, setChainStatus] = useState<"idle" | "submitting" | "finalized" | "error">("idle");
  const formed = ratified.length === 2;
  const hash = useMemo(() => stage === "conflict" ? "a8e7…91c2" : "7fd9…c04a", [stage]);
  const resolve = () => { setStage("ready"); setRatified([]); setNotice("Amendment applied. Re-analysis found equivalent obligations."); };
  const ratify = (party:string) => { setRatified(x => x.includes(party) ? x : [...x, party]); setNotice(party + " ratified canonical hash " + hash + "."); };
  const reset = () => { setStage("conflict"); setRatified([]); setNotice("Demo conflict restored."); };
  const connectWallet = async () => {
    try {
      const provider = (window as unknown as { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> } }).ethereum;
      if (!provider) throw new Error("No EIP-1193 wallet found. Install or unlock a compatible wallet.");
      const result = await connectStudioDev(provider);
      setWallet(result.account);
      setNotice("Wallet connected to Studio-dev 61997.");
    } catch (error) {
      setChainStatus("error");
      setNotice(error instanceof Error ? error.message : "Wallet connection failed.");
    }
  };
  const evaluateOnGenLayer = async () => {
    const address = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS as `0x${string}` | undefined;
    if (!address) { setNotice("Studio Next contract address is not configured yet."); return; }
    const provider = (window as unknown as { ethereum?: { request(args: { method: string; params?: unknown[] }): Promise<unknown> } }).ethereum;
    if (!provider) { setNotice("Connect a Studio-dev wallet first."); return; }
    try {
      setChainStatus("submitting");
      const receipt = await submitConsensus(provider, address, {
        agreementId: "AG-2026-041",
        buyerInterpretation: JSON.stringify(fields.map(([name, buyer]) => ({ name, value: buyer }))),
        sellerInterpretation: JSON.stringify(fields.map(([name, buyer, seller], index) => ({ name, value: index ? seller : buyer }))),
        question: "Do these interpretations establish materially equivalent obligations?",
      });
      setChainStatus("finalized");
      setNotice(`Studio-dev finalization succeeded: ${receipt.transactionHash.slice(0, 10)}…`);
    } catch (error) {
      setChainStatus("error");
      setNotice(error instanceof Error ? error.message : "GenLayer transaction failed.");
    }
  };
  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#workspace"><span className="mark">C</span><span>CLAUSUM</span></a><nav><a href="#workspace">Workspace</a><a href="#receipt">Receipts</a><a href="#verify">Verify</a></nav><div className="network"><span className="signal" /> Studio-dev <span className="muted">• 61997</span><button className="wallet" onClick={connectWallet}>{wallet ? wallet.slice(0, 6) + "…" + wallet.slice(-4) : "Connect wallet"}</button></div></header>
    <section className="intro" id="workspace"><div><p className="eyebrow">FORMATION WORKSPACE / AG-2026-041</p><h1>Establish shared meaning<br/>before commitment.</h1></div><div className="intro-actions"><span className={"status " + (stage === "conflict" ? "danger" : formed ? "success" : "ready")}>{formed ? "FORMED" : stage === "conflict" ? "CONFLICT" : "READY"}</span><button className="secondary" onClick={reset}>Reset demo</button></div></section>
    <section className="agreement panel"><div className="section-heading"><div><p className="eyebrow">PROPOSED AGREEMENT</p><h2>European provider intelligence report</h2></div><Hash value="sha256: a8e7…91c2"/></div><p className="agreement-copy">Produce a competitor report covering the five largest European providers, using public sources, by Friday at 17:00.</p><div className="parties"><span><b>BUYER</b> Atlas Procurement Agent</span><span><b>SELLER</b> Meridian Research Agent</span><span><b>POLICY</b> CLAUSUM v0.1</span></div></section>
    <section className="interpretation-grid">{["Party A / Buyer", "Party B / Seller"].map((party, index) => <article className="panel interpretation" key={party}><div className="section-heading"><div><p className="eyebrow">{party}</p><h2>{index ? "Meridian Research" : "Atlas Procurement"}</h2></div><span className="mini-badge">INDEPENDENT</span></div><dl>{fields.map(([name,buyer,seller]) => <div key={name}><dt>{name}</dt><dd>{index && stage === "conflict" ? seller : buyer}</dd></div>)}</dl><div className="interpretation-foot"><span>Structured obligation model</span><Hash value={index && stage === "conflict" ? "0xb83…9d" : "0x4c2…e1"}/></div></article>)}</section>
    <section className="comparison panel"><div className="section-heading"><div><p className="eyebrow">COMPARISON ENGINE</p><h2>Obligation alignment</h2></div><span className="provider">{chainStatus === "finalized" ? "STUDIO-DEV FINALIZED" : stage === "conflict" ? "LOCAL FALLBACK" : "EQUIVALENCE CONFIRMED"}</span></div><div className="rows">{fields.map(([name,buyer,seller], index) => { const mismatch = stage === "conflict" && index > 0; return <div className="compare-row" key={name}><span>{name}</span><strong>{buyer}</strong><strong>{mismatch ? seller : buyer}</strong><em className={mismatch ? "bad" : "ok"}>{mismatch ? index === 1 ? "SEMANTIC REVIEW" : "CONFLICT" : index === 1 ? "EQUIVALENT" : "MATCH"}</em></div>; })}</div>{stage === "conflict" ? <div className="conflict-box"><div><p className="eyebrow">SEMANTIC CONSENSUS RESULT</p><h3>Material conflict detected.</h3><p>The parties commit to different scope, evidence and delivery obligations. Formation is blocked.</p></div><div className="stack-actions"><button onClick={evaluateOnGenLayer} disabled={chainStatus === "submitting"}>{chainStatus === "submitting" ? "Awaiting consensus…" : "Evaluate on Studio-dev"}</button><button className="secondary" onClick={resolve}>Resolve &amp; re-analyze</button></div></div> : <div className="success-box"><div><p className="eyebrow">SEMANTIC CONSENSUS RESULT</p><h3>Shared meaning established.</h3><p>Local demo provider returned EQUIVALENT. Studio-dev writes become available after configuring a deployed contract address.</p></div></div>}</section>
    <section className="formation-grid"><article className="panel canonical"><p className="eyebrow">CANONICAL AGREEMENT OBJECT</p><h2>One object. One hash.</h2><pre>{'{\n  "scope": "five largest EU providers by revenue",\n  "evidence": "two independent public sources",\n  "deadline": "Friday 17:00 CET",\n  "policyVersion": "0.1"\n}'}</pre><Hash value={"sha256: " + hash}/><button disabled={stage === "conflict"} onClick={() => setNotice("Canonical object copied to verification queue.")}>Compile agreement object</button></article><article className="panel ratification"><p className="eyebrow">RATIFICATION</p><h2>Both parties must approve the exact hash.</h2>{["Atlas Procurement", "Meridian Research"].map(party => <div className="ratify-row" key={party}><span><i className={"check " + (ratified.includes(party) ? "yes" : "")}>{ratified.includes(party) ? "✓" : ""}</i>{party}</span><button disabled={stage === "conflict" || ratified.includes(party)} onClick={() => ratify(party)}>{ratified.includes(party) ? "Ratified" : "Ratify"}</button></div>)}<p className="muted-line">{stage === "conflict" ? "Resolve all conflicts to enable ratification." : formed ? "Matching ratifications recorded." : "Awaiting matching approvals."}</p></article></section>
    <section className="bottom-grid"><article className="panel timeline"><p className="eyebrow">AUDIT TIMELINE</p><h2>Formation record</h2><ol>{["Agreement created","Independent interpretations generated","Deterministic comparison completed",stage === "conflict" ? "Material conflict detected" : "Agreement amended",stage === "conflict" ? "Semantic review pending" : "Shared meaning established"].map((item,i) => <li key={item}><time>20:{41+i}</time><span className={i===4 ? "current" : ""}>{item}</span></li>)}</ol></article><article className={"panel receipt " + (formed ? "issued" : "")} id="receipt"><p className="eyebrow">FORMATION RECEIPT</p><h2>{formed ? "Agreement formed." : "Awaiting formation."}</h2><p>{formed ? "The parties ratified the same canonical agreement object." : "A receipt is issued only after every conflict is resolved and both parties ratify."}</p><Hash value={formed ? "receipt: clm_01J6…A91" : "receipt: pending"}/><button disabled={!formed} onClick={() => setNotice("Formation receipt verified against local audit trail.")}>Verify receipt</button></article></section>
    <div className="toast" role="status">{notice}</div><footer>A signature proves approval. <strong>CLAUSUM proves shared meaning.</strong></footer>
  </main>;
}
