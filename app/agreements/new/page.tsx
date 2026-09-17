"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormation } from "../../../lib/formation-context";
import type { ObligationModel } from "../../../lib/formation";
import { demoScenarios, type DemoScenario } from "../../../lib/demo-scenarios";
import { ProtocolBadge } from "../../../components/ui/ProtocolPrimitives";

export default function NewAgreementPage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [partyBText, setPartyBText] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [bAddress, setBAddress] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [obligations, setObligations] = useState<ObligationModel>({ scope: "", evidence: "", deadline: "", quantity: 0 });
  const [partyBObligations, setPartyBObligations] = useState<ObligationModel>({ scope: "", evidence: "", deadline: "", quantity: 0 });
  const router = useRouter();
  const { configureDraft, status } = useFormation();
  const submitting = status === "submitting";
  const load = (scenario: DemoScenario) => {
    setTitle(scenario.title);
    setText(scenario.text);
    setPartyBText(scenario.text);
    setObligations(scenario.obligations);
    setPartyBObligations({ ...scenario.obligations, evidence: "one public source", deadline: "Friday 17:00 UTC" });
    setSelectedScenario(scenario);
  };

  return (
    <div className="page">
      <div className="page-heading centered">
        <ProtocolBadge tone="violet">NEW AGREEMENT · V2</ProtocolBadge>
        <h1>Start with shared meaning.</h1>
        <p>Shape an agreement object for the guided demo interpretation flow.</p>
      </div>
      <div className="wizard-grid">
        <form
          className="form-panel"
          onSubmit={event => {
            event.preventDefault();
            if (submitting) return;
            configureDraft({
              title,
              partyAName: a,
              partyBName: b,
              partyBAddress: bAddress,
              partyAInterpretation: text,
              partyBInterpretation: partyBText || text,
              obligations,
              partyBObligations,
            });
            router.push("/workspace");
          }}
        >
          <div className="form-field">
            <label htmlFor="title">AGREEMENT TITLE</label>
            <input id="title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. European provider intelligence report" required />
          </div>
          <div className="form-field">
            <label htmlFor="party-a">PARTY A</label>
            <input id="party-a" value={a} onChange={event => setA(event.target.value)} placeholder="e.g. Atlas Procurement" required />
          </div>
          <div className="form-field">
            <label htmlFor="party-b">PARTY B</label>
            <input id="party-b" value={b} onChange={event => setB(event.target.value)} placeholder="e.g. Meridian Research" required />
          </div>
          <div className="form-field">
            <label htmlFor="party-b-address">PARTY B WALLET ADDRESS</label>
            <input
              id="party-b-address"
              value={bAddress}
              onChange={event => setBAddress(event.target.value)}
              placeholder="0x… (required for onchain formation)"
              pattern="^0x[a-fA-F0-9]{40}$"
              title="Enter a 20-byte hexadecimal wallet address."
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="agreement-text">NATURAL LANGUAGE AGREEMENT</label>
            <textarea
              id="agreement-text"
              value={text}
              onChange={event => {
                setText(event.target.value);
                setSelectedScenario(null);
              }}
              placeholder="Describe the obligations both parties should understand…"
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="party-b-interpretation">PARTY B INTERPRETATION</label>
            <textarea
              id="party-b-interpretation"
              value={partyBText}
              onChange={event => setPartyBText(event.target.value)}
              placeholder="Describe how Party B understands the same obligations…"
              required
            />
            <small>Both texts are committed independently and sent to GenLayer as untrusted semantic data.</small>
          </div>
          <div className="structured-fields">
            <div className="section-kicker">PARTY A · STRUCTURED OBLIGATIONS</div>
            <p className="field-help">These values are committed as hard contract parameters and compared before semantic consensus.</p>
            <div className="structured-grid">
              <div className="form-field">
                <label htmlFor="scope">SCOPE</label>
                <input id="scope" value={obligations.scope} onChange={event => setObligations(current => ({ ...current, scope: event.target.value }))} placeholder="e.g. 12 critical API endpoints" required />
              </div>
              <div className="form-field">
                <label htmlFor="evidence">EVIDENCE</label>
                <input id="evidence" value={obligations.evidence} onChange={event => setObligations(current => ({ ...current, evidence: event.target.value }))} placeholder="e.g. two independent penetration-test reports" required />
              </div>
              <div className="form-field">
                <label htmlFor="deadline">DEADLINE</label>
                <input id="deadline" value={obligations.deadline} onChange={event => setObligations(current => ({ ...current, deadline: event.target.value }))} placeholder="e.g. 2026-09-30T17:00:00Z" required />
              </div>
              <div className="form-field">
                <label htmlFor="quantity">QUANTITY</label>
                <input id="quantity" type="number" min="1" step="1" value={obligations.quantity || ""} onChange={event => setObligations(current => ({ ...current, quantity: event.target.value ? Math.max(1, Number(event.target.value)) : 0 }))} placeholder="e.g. 12" required />
              </div>
            </div>
          </div>
          <div className="structured-fields party-b-structured">
            <div className="section-kicker">PARTY B · STRUCTURED OBLIGATIONS</div>
            <p className="field-help">Party B submits its own hard-field interpretation. Keep these aligned for an equivalent result.</p>
            <div className="structured-grid">
              <div className="form-field">
                <label htmlFor="party-b-scope">SCOPE</label>
                <input id="party-b-scope" value={partyBObligations.scope} onChange={event => setPartyBObligations(current => ({ ...current, scope: event.target.value }))} placeholder="e.g. 12 critical API endpoints" required />
              </div>
              <div className="form-field">
                <label htmlFor="party-b-evidence">EVIDENCE</label>
                <input id="party-b-evidence" value={partyBObligations.evidence} onChange={event => setPartyBObligations(current => ({ ...current, evidence: event.target.value }))} placeholder="e.g. two independent penetration-test reports" required />
              </div>
              <div className="form-field">
                <label htmlFor="party-b-deadline">DEADLINE</label>
                <input id="party-b-deadline" value={partyBObligations.deadline} onChange={event => setPartyBObligations(current => ({ ...current, deadline: event.target.value }))} placeholder="e.g. 2026-09-30T17:00:00Z" required />
              </div>
              <div className="form-field">
                <label htmlFor="party-b-quantity">QUANTITY</label>
                <input id="party-b-quantity" type="number" min="1" step="1" value={partyBObligations.quantity || ""} onChange={event => setPartyBObligations(current => ({ ...current, quantity: event.target.value ? Math.max(1, Number(event.target.value)) : 0 }))} placeholder="e.g. 12" required />
              </div>
            </div>
          </div>
          <div className="draft-preview">
            <span>AGREEMENT OBJECT</span>
            <strong>{title || "Untitled agreement"}</strong>
            <small>
              {text.trim()
                ? selectedScenario
                  ? `${text.trim().split(/\s+/).length} words · structured demo obligations`
                  : `${text.trim().split(/\s+/).length} words · conservative obligation estimate`
                : "Add a description to derive the obligation model"}
            </small>
          </div>
          <button className="button primary" type="submit" disabled={submitting} title={submitting ? "Wait for the current semantic evaluation to finish." : undefined}>
            <FilePlus2 size={16} /> Create and open workspace <ArrowRight size={16} />
          </button>
        </form>
        <aside className="preview-panel">
          <ProtocolBadge tone="live"><Sparkles size={13} /> SCENARIO LOADER</ProtocolBadge>
          <h2>Load a guided demo scenario</h2>
          <p>Use a ready-made agreement to move into deterministic comparison.</p>
          <div className="scenario-list">
            {demoScenarios.map(scenario => (
              <button className="scenario-button" key={scenario.name} type="button" onClick={() => load(scenario)}>
                {scenario.name}<ArrowRight size={14} />
              </button>
            ))}
          </div>
          <Link className="text-link" href="/workspace">Continue with active demo <ArrowRight size={15} /></Link>
        </aside>
      </div>
    </div>
  );
}
