"use client";

import { Check, Fingerprint } from "lucide-react";
import { useFormation } from "../../lib/formation-context";

export function RatificationCard({ party }: { party: "a" | "b" }) { const { ratifications, canonicalHash, ready, ratify, partyAName, partyBName } = useFormation(); const isA = party === "a"; const value = isA ? ratifications.a : ratifications.b; const locked = !!value && value === canonicalHash; const name = isA ? partyAName : partyBName; return <div className={`ratification-card ${locked ? "locked" : ""} ${isA ? "party-a" : "party-b"}`}><div className="ratifier-icon">{locked ? <Check size={20} /> : <Fingerprint size={20} />}</div><div><strong>{name}</strong><small>{locked ? "Exact canonical hash locked" : "Independent approval required"}</small></div><button type="button" disabled={!ready || locked} onClick={() => ratify(name)}>{locked ? "Ratified" : ready ? "Ratify hash" : "Locked"}</button></div>; }
