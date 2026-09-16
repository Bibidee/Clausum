"use client";

import { useFormation } from "../../lib/formation-context";
import { ProtocolBadge } from "../ui/ProtocolPrimitives";

export function InterpretationPanel({ party }: { party: "a" | "b" }) { const { partyAObligations, partyBObligations, conflicts, partyAName, partyBName } = useFormation(); const isA = party === "a"; const data = isA ? partyAObligations : partyBObligations; const name = isA ? partyAName : partyBName; return <article className={`interpretation-panel party-${party}`}><div className="panel-heading"><div><ProtocolBadge tone={isA ? "live" : "violet"}>PARTY {party.toUpperCase()} · {isA ? "BUYER" : "SELLER"}</ProtocolBadge><h2>{name}</h2></div><span className="identity-orb" /></div><div className="obligation-list">{Object.entries(data).map(([key, value]) => { const mismatch = !isA && conflicts.includes(key); return <div className={`obligation-row ${mismatch ? "mismatch" : "aligned"}`} key={key}><span>{key}</span><strong>{typeof value === "number" ? `${value} providers` : value}</strong><i>{mismatch ? "CONFLICT" : "ALIGNED"}</i></div>; })}</div></article>; }
