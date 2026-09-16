"use client";

import { ArrowDown, CircleDot, FileText, Sparkles } from "lucide-react";
import { useFormation } from "../../lib/formation-context";

export function SemanticSculpture() {
  const { outcome, status, conflicts } = useFormation();
  const state = status === "submitting" ? "pending" : outcome === "EQUIVALENT" ? "equivalent" : conflicts.length ? "conflict" : "idle";

  return (
    <div className={`semantic-sculpture ${state}`} aria-label="Two interpretations converging into one canonical meaning">
      <div className="sculpture-orbit orbit-one" />
      <div className="sculpture-orbit orbit-two" />
      <div className="document-sheet sheet-a">
        <div className="sheet-top"><span className="sheet-mark"><FileText size={13} /></span><span>PARTY A · INTERPRETATION</span></div>
        <strong>Atlas Procurement</strong>
        <span className="sheet-rule" /><span className="sheet-rule short" />
        <div className="sheet-chip">scope · five EU providers</div>
        <div className="sheet-chip">evidence · public sources</div>
      </div>
      <div className="document-sheet sheet-b">
        <div className="sheet-top"><span className="sheet-mark violet"><FileText size={13} /></span><span>PARTY B · INTERPRETATION</span></div>
        <strong>Meridian Research</strong>
        <span className="sheet-rule" /><span className="sheet-rule short" />
        <div className="sheet-chip">scope · five EU providers</div>
        <div className="sheet-chip">deadline · Friday 17:00</div>
      </div>
      <div className="semantic-strands strands-a"><i /><i /><i /></div>
      <div className="semantic-strands strands-b"><i /><i /><i /></div>
      <div className="sculpture-node">
        <CircleDot size={20} />
        <strong>GL</strong>
        <small>{state === "equivalent" ? "ALIGNED" : state === "conflict" ? "DIVERGENT" : state === "pending" ? "JUDGING" : "SEMANTIC NODE"}</small>
        <span className="node-spark"><Sparkles size={12} /></span>
      </div>
      <div className="sculpture-output"><ArrowDown size={16} /><span>{state === "equivalent" ? "CANONICAL AGREEMENT" : "MEANING ENGINE"}</span></div>
    </div>
  );
}
