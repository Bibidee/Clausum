"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { canForm, canonicalHash, createFormationReceipt, deterministicConflicts, evaluationInputHash, stableStringify, type FormationReceipt, type ObligationModel, type SemanticOutcome } from "./formation";
import { connectStudioDev, submitConsensus, type Eip1193Provider } from "./genlayer";

const QUESTION = "Do these interpretations establish materially equivalent obligations?";
const CONTRACT = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";
const makeDemoId = () => `AG-${Date.now().toString(36).toUpperCase()}`;

export interface FormationState {
  agreementId: string;
  agreementTitle: string;
  partyAName: string;
  partyBName: string;
  obligations: ObligationModel;
  stage: "conflict" | "ready";
  outcome: SemanticOutcome;
  status: "idle" | "submitting" | "finalized" | "error";
  canonicalHash: string;
  evaluationHash: string;
  verdictHash: string;
  tx: string;
  wallet: string | null;
  ratifications: { a: string; b: string };
  receipt: FormationReceipt | null;
  notice: string;
}

interface FormationContextValue extends FormationState {
  partyA: string;
  partyB: string;
  partyAObligations: ObligationModel;
  partyBObligations: ObligationModel;
  conflicts: string[];
  ready: boolean;
  formed: boolean;
  life: string;
  model: { parties: string[]; obligations: ObligationModel; policyVersion: string };
  reset: () => void;
  configureDraft: (draft: { title: string; partyAName: string; partyBName: string; obligations: ObligationModel }) => void;
  amend: () => void;
  connect: () => Promise<void>;
  setWalletSession: (wallet: string | null, provider: Eip1193Provider | null) => void;
  evaluate: () => Promise<void>;
  ratify: (party: string) => void;
}

const FormationContext = createContext<FormationContextValue | null>(null);

export function FormationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormationState>({ agreementId: "AG-DEMO", agreementTitle: "European provider intelligence report", partyAName: "Atlas Procurement", partyBName: "Meridian Research", obligations: { scope: "five largest EU providers by revenue", evidence: "two independent public sources", deadline: "Friday 17:00 CET", quantity: 5 }, stage: "conflict", outcome: "UNRESOLVED", status: "idle", canonicalHash: "", evaluationHash: "", verdictHash: "", tx: "", wallet: null, ratifications: { a: "", b: "" }, receipt: null, notice: "Agreement workspace ready." });
  const walletProviderRef = useRef<Eip1193Provider | null>(null);
  const model = useMemo(() => ({ parties: [state.partyAName, state.partyBName], obligations: state.obligations, policyVersion: "0.1" }), [state.partyAName, state.partyBName, state.obligations]);
  const partyAObligations = model.obligations;
  const partyBObligations = useMemo<ObligationModel>(() => state.stage === "conflict" ? { scope: model.obligations.scope, evidence: "one public source", deadline: "Friday 17:00 UTC", quantity: 5 } : model.obligations, [model, state.stage]);
  const partyA = useMemo(() => stableStringify(partyAObligations), [partyAObligations]);
  const partyB = useMemo(() => stableStringify(partyBObligations), [partyBObligations]);
  const input = useMemo(() => ({ agreementId: state.agreementId, partyA, partyB, question: QUESTION, policyVersion: model.policyVersion }), [state.agreementId, partyA, partyB, model.policyVersion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("clausum-formation");
    if (saved) { try { setState(previous => ({ ...previous, ...JSON.parse(saved) })); } catch { /* ignore malformed session state */ } }
  }, []);
  useEffect(() => { if (typeof window !== "undefined") window.sessionStorage.setItem("clausum-formation", JSON.stringify(state)); }, [state]);
  useEffect(() => { void canonicalHash(model).then(value => setState(previous => ({ ...previous, canonicalHash: value }))); void evaluationInputHash(input).then(value => setState(previous => ({ ...previous, evaluationHash: value }))); }, [input, model]);

  const conflicts = useMemo(() => deterministicConflicts(partyAObligations, partyBObligations), [partyAObligations, partyBObligations]);
  const ready = canForm(state.outcome, conflicts, state.canonicalHash, state.canonicalHash, state.evaluationHash, state.verdictHash);
  const formed = canForm(state.outcome, conflicts, state.ratifications.a, state.ratifications.b, state.evaluationHash, state.verdictHash) && !!state.receipt;
  const life = formed ? "FORMED" : ready ? "READY FOR RATIFICATION" : conflicts.length ? "CONFLICT" : "SEMANTIC REVIEW";
  const clearRuntime = () => setState(previous => ({ ...previous, outcome: "UNRESOLVED", verdictHash: "", tx: "", status: "idle", ratifications: { a: "", b: "" }, receipt: null }));
  const reset = () => setState(previous => ({ ...previous, agreementId: makeDemoId(), agreementTitle: "European provider intelligence report", partyAName: "Atlas Procurement", partyBName: "Meridian Research", obligations: { scope: "five largest EU providers by revenue", evidence: "two independent public sources", deadline: "Friday 17:00 CET", quantity: 5 }, stage: "conflict", outcome: "UNRESOLVED", verdictHash: "", tx: "", status: "idle", ratifications: { a: "", b: "" }, receipt: null, notice: "Agreement workspace ready." }));
  const configureDraft = (draft: { title: string; partyAName: string; partyBName: string; obligations: ObligationModel }) => setState(previous => ({ ...previous, agreementId: makeDemoId(), agreementTitle: draft.title.trim() || "Untitled agreement", partyAName: draft.partyAName.trim() || "Party A", partyBName: draft.partyBName.trim() || "Party B", obligations: draft.obligations, stage: "conflict", outcome: "UNRESOLVED", verdictHash: "", tx: "", status: "idle", ratifications: { a: "", b: "" }, receipt: null, notice: "Draft ready. Add both interpretations, then evaluate meaning." }));
  const amend = () => { setState(previous => ({ ...previous, stage: "ready" })); clearRuntime(); setState(previous => ({ ...previous, notice: "Interpretations changed. Previous semantic verdict invalidated." })); };
  const setWalletSession = useCallback((wallet: string | null, provider: Eip1193Provider | null) => { walletProviderRef.current = provider; setState(previous => previous.wallet === wallet ? previous : ({ ...previous, wallet, notice: wallet ? "Wallet connected to Studio-dev · 61997." : "Wallet disconnected." })); }, []);
  const connect = async () => { const provider = walletProviderRef.current; if (!provider) { setState(previous => ({ ...previous, notice: "Open the wallet connection dialog to connect a Studio-dev wallet." })); return; } try { const result = await connectStudioDev(provider); setWalletSession(result.account, provider); } catch (error) { setState(previous => ({ ...previous, notice: error instanceof Error ? error.message : "Wallet connection failed." })); } };
  const evaluate = async () => { const provider = walletProviderRef.current; if (!CONTRACT) { setState(previous => ({ ...previous, notice: "A fresh Studio Next contract address is required before semantic evaluation." })); return; } if (!provider) { setState(previous => ({ ...previous, notice: "Connect a Studio-dev wallet before evaluating meaning." })); return; } try { setState(previous => ({ ...previous, status: "submitting", notice: "Submitting semantic question to GenLayer validators…" })); const result = await submitConsensus(provider, CONTRACT as `0x${string}`, { agreementId: state.agreementId, inputHash: state.evaluationHash, buyerInterpretation: partyA, sellerInterpretation: partyB, question: QUESTION }); setState(previous => ({ ...previous, outcome: result.outcome, verdictHash: state.evaluationHash, tx: result.transactionHash, status: "finalized", notice: result.outcome === "EQUIVALENT" ? "Validator consensus established material equivalence." : "Formation is blocked until these obligations converge." })); } catch (error) { setState(previous => ({ ...previous, status: "error", notice: error instanceof Error ? error.message : "GenLayer transaction failed." })); } };
  const ratify = (party: string) => { if (!ready) return; const next = party === state.partyAName ? { ...state.ratifications, a: state.canonicalHash } : { ...state.ratifications, b: state.canonicalHash }; const nextReceipt = next.a === state.canonicalHash && next.b === state.canonicalHash && state.outcome === "EQUIVALENT" && !!state.tx && state.evaluationHash === state.verdictHash ? createFormationReceipt({ agreementId: state.agreementId, canonicalAgreementHash: state.canonicalHash, evaluationInputHash: state.verdictHash, verdict: state.outcome, transactionHash: state.tx, contractAddress: CONTRACT, network: "Studio-dev", partyARatifiedHash: next.a, partyBRatifiedHash: next.b, policyVersion: model.policyVersion, formedAt: new Date().toISOString() }) : null; setState(previous => ({ ...previous, ratifications: next, receipt: nextReceipt || previous.receipt, notice: `${party} ratified the exact canonical hash.` })); };

  return <FormationContext.Provider value={{ ...state, partyA, partyB, partyAObligations, partyBObligations, conflicts, ready, formed, life, model, reset, configureDraft, amend, connect, setWalletSession, evaluate, ratify }}>{children}</FormationContext.Provider>;
}

export function useFormation() { const context = useContext(FormationContext); if (!context) throw new Error("useFormation must be used inside FormationProvider"); return context; }
export { QUESTION, CONTRACT };
