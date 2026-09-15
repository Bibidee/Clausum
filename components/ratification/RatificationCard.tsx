"use client";

import { Check, Fingerprint } from "lucide-react";
import { useFormation } from "../../lib/formation-context";

export function RatificationCard({ party }: { party: "Atlas Procurement" | "Meridian Research" }) { const { ratifications, canonicalHash, ready, ratify } = useFormation(); const isA = party === "Atlas Procurement"; const value = isA ? ratifications.a : ratifications.b; const locked = !!value && value === canonicalHash; return <div className={`ratification-card ${locked ? "locked" : ""} ${isA ? "party-a" : "party-b"}`}><div className="ratifier-icon">{locked ? <Check size={20} /> : <Fingerprint size={20} />}</div><div><strong>{party}</strong><small>{locked ? "Exact canonical hash locked" : "Independent approval required"}</small></div><button type="button" disabled={!ready || locked} onClick={() => ratify(party)}>{locked ? "Ratified" : ready ? "Ratify hash" : "Locked"}</button></div>; }
