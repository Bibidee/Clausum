"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  canForm,
  canEvaluateCurrentInput,
  canonicalHash,
  createFormationReceipt,
  deterministicConflicts,
  evaluationInputHash,
  isFormationReceiptConsistent,
  isEvaluationFinalized,
  isEvaluationRequestCurrent,
  stableStringify,
  type FormationReceipt,
  type ObligationModel,
  type SemanticOutcome,
} from "./formation";
import { connectStudioDev, isStudioDevChain, readProviderChainId, studioDevConfig, submitConsensus, type Eip1193Provider } from "./genlayer";

const QUESTION = "Do these interpretations establish materially equivalent obligations?";
const CONTRACT = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";
const makeDemoId = () => `AG-${Date.now().toString(36).toUpperCase()}`;

export type HashStatus = "idle" | "calculating" | "ready";

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
  canonicalHashStatus: HashStatus;
  evaluationHashStatus: HashStatus;
  semanticVersion: number;
  verdictHash: string;
  tx: string;
  wallet: string | null;
  walletChainId: number | null;
  walletReady: boolean;
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
  hashesReady: boolean;
  evaluationReady: boolean;
  evaluationFinalized: boolean;
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

export function initialState(): FormationState {
  return {
    agreementId: "AG-DEMO",
    agreementTitle: "European provider intelligence report",
    partyAName: "Atlas Procurement",
    partyBName: "Meridian Research",
    obligations: {
      scope: "five largest EU providers by revenue",
      evidence: "two independent public sources",
      deadline: "Friday 17:00 CET",
      quantity: 5,
    },
    stage: "conflict",
    outcome: "UNRESOLVED",
    status: "idle",
    canonicalHash: "",
    evaluationHash: "",
    canonicalHashStatus: "idle",
    evaluationHashStatus: "idle",
    semanticVersion: 0,
    verdictHash: "",
    tx: "",
    wallet: null,
    walletChainId: null,
    walletReady: false,
    ratifications: { a: "", b: "" },
    receipt: null,
    notice: "Agreement workspace ready.",
  };
}

export function clearRuntime(previous: FormationState, semanticVersion = previous.semanticVersion): FormationState {
  return {
    ...previous,
    outcome: "UNRESOLVED",
    status: "idle",
    canonicalHash: "",
    evaluationHash: "",
    canonicalHashStatus: "idle",
    evaluationHashStatus: "idle",
    semanticVersion,
    verdictHash: "",
    tx: "",
    ratifications: { a: "", b: "" },
    receipt: null,
  };
}

export function FormationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormationState>(() => initialState());
  const [hydrated, setHydrated] = useState(false);
  const walletProviderRef = useRef<Eip1193Provider | null>(null);
  const hashRequestRef = useRef(0);
  const evaluationRequestRef = useRef(0);
  const model = useMemo(() => ({
    parties: [state.partyAName, state.partyBName],
    obligations: state.obligations,
    policyVersion: "0.1",
  }), [state.partyAName, state.partyBName, state.obligations]);
  const partyAObligations = model.obligations;
  const partyBObligations = useMemo<ObligationModel>(() => state.stage === "conflict"
    ? { scope: model.obligations.scope, evidence: "one public source", deadline: "Friday 17:00 UTC", quantity: 5 }
    : model.obligations, [model, state.stage]);
  const partyA = useMemo(() => stableStringify(partyAObligations), [partyAObligations]);
  const partyB = useMemo(() => stableStringify(partyBObligations), [partyBObligations]);
  const input = useMemo(() => ({
    agreementId: state.agreementId,
    partyA,
    partyB,
    question: QUESTION,
    policyVersion: model.policyVersion,
  }), [state.agreementId, partyA, partyB, model.policyVersion]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.sessionStorage.getItem("clausum-formation");
    if (!saved) { setHydrated(true); return; }
    try {
      const parsed = JSON.parse(saved) as Partial<FormationState>;
      setState(previous => ({
        ...previous,
        ...parsed,
        status: parsed.status === "submitting" ? "idle" : parsed.status ?? "idle",
        canonicalHash: "",
        evaluationHash: "",
        canonicalHashStatus: "idle",
        evaluationHashStatus: "idle",
        wallet: null,
        walletChainId: null,
        walletReady: false,
      }));
    } catch {
      // Ignore malformed session state and keep the fresh demo.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") window.sessionStorage.setItem("clausum-formation", JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    const request = ++hashRequestRef.current;
    const requestVersion = state.semanticVersion;
    setState(previous => ({
      ...previous,
      canonicalHash: "",
      evaluationHash: "",
      canonicalHashStatus: "calculating",
      evaluationHashStatus: "calculating",
    }));
    void Promise.all([canonicalHash(model), evaluationInputHash(input)]).then(([nextCanonicalHash, nextEvaluationHash]) => {
      if (request !== hashRequestRef.current) return;
      setState(previous => {
        if (previous.semanticVersion !== requestVersion || previous.agreementId !== input.agreementId) return previous;
        return {
          ...previous,
          canonicalHash: nextCanonicalHash,
          evaluationHash: nextEvaluationHash,
          canonicalHashStatus: "ready",
          evaluationHashStatus: "ready",
        };
      });
    });
  }, [input, model, state.semanticVersion]);

  const conflicts = useMemo(() => deterministicConflicts(partyAObligations, partyBObligations), [partyAObligations, partyBObligations]);
  const hashesReady = state.canonicalHashStatus === "ready"
    && state.evaluationHashStatus === "ready"
    && Boolean(state.canonicalHash && state.evaluationHash);
  const evaluationFinalized = isEvaluationFinalized({
    status: state.status,
    evaluationHash: state.evaluationHash,
    verdictHash: state.verdictHash,
    transactionHash: state.tx,
    hashesReady,
  });
  const ready = hashesReady
    && state.status === "finalized"
    && Boolean(state.tx)
    && canForm(state.outcome, conflicts, state.canonicalHash, state.canonicalHash, state.evaluationHash, state.verdictHash);
  const evaluationReady = canEvaluateCurrentInput({
    hashesReady,
    evaluationFinalized,
    submitting: state.status === "submitting",
    contractConfigured: Boolean(CONTRACT),
    providerAvailable: Boolean(walletProviderRef.current),
    walletReady: state.walletReady,
    walletChainId: state.walletChainId,
    requiredChainId: studioDevConfig.chainId,
  });
  const formed = ready
    && canForm(state.outcome, conflicts, state.ratifications.a, state.ratifications.b, state.evaluationHash, state.verdictHash)
    && isFormationReceiptConsistent(state.receipt, {
      agreementId: state.agreementId,
      canonicalHash: state.canonicalHash,
      evaluationHash: state.evaluationHash,
      verdictHash: state.verdictHash,
      transactionHash: state.tx,
      contractAddress: CONTRACT,
      network: "Studio-dev",
      policyVersion: model.policyVersion,
    });
  const life = state.canonicalHashStatus === "calculating" || state.evaluationHashStatus === "calculating"
    ? "CALCULATING HASH"
    : formed ? "FORMED" : ready ? "READY FOR RATIFICATION" : conflicts.length ? "CONFLICT" : "SEMANTIC REVIEW";

  const reset = () => {
    if (state.status === "submitting") {
      setState(previous => ({ ...previous, notice: "Wait for the current semantic evaluation to finish." }));
      return;
    }
    evaluationRequestRef.current += 1;
    const next = initialState();
    setState(previous => ({
      ...next,
      wallet: previous.wallet,
      walletChainId: previous.walletChainId,
      walletReady: previous.walletReady,
      semanticVersion: previous.semanticVersion + 1,
    }));
  };

  const configureDraft = (draft: { title: string; partyAName: string; partyBName: string; obligations: ObligationModel }) => {
    if (state.status === "submitting") {
      setState(previous => ({ ...previous, notice: "Wait for the current semantic evaluation to finish." }));
      return;
    }
    evaluationRequestRef.current += 1;
    setState(previous => ({
      ...clearRuntime(previous, previous.semanticVersion + 1),
      agreementId: makeDemoId(),
      agreementTitle: draft.title.trim() || "Untitled agreement",
      partyAName: draft.partyAName.trim() || "Party A",
      partyBName: draft.partyBName.trim() || "Party B",
      obligations: draft.obligations,
      stage: "conflict",
      notice: "Guided demo draft ready. Review both interpretations, then evaluate meaning.",
    }));
  };

  const amend = () => {
    if (state.status === "submitting") {
      setState(previous => ({ ...previous, notice: "Wait for the current semantic evaluation to finish." }));
      return;
    }
    evaluationRequestRef.current += 1;
    setState(previous => ({
      ...clearRuntime(previous, previous.semanticVersion + 1),
      stage: "ready",
      notice: "Guided demo amendment applied. Previous semantic verdict invalidated; re-evaluation is required.",
    }));
  };

  const setWalletSession = useCallback((wallet: string | null, provider: Eip1193Provider | null) => {
    walletProviderRef.current = provider;
    if (!wallet || !provider) {
      setState(previous => ({
        ...previous,
        wallet: null,
        walletChainId: null,
        walletReady: false,
        notice: "Wallet disconnected.",
      }));
      return;
    }
    setState(previous => ({
      ...previous,
      wallet,
      walletChainId: null,
      walletReady: false,
      notice: "Checking wallet network…",
    }));
    void readProviderChainId(provider).then(chainId => {
      if (walletProviderRef.current !== provider) return;
      setState(previous => {
        if (previous.wallet !== wallet) return previous;
        const onStudioDev = isStudioDevChain(chainId);
        return {
          ...previous,
          walletChainId: chainId,
          walletReady: onStudioDev,
          notice: onStudioDev
            ? "Wallet connected to Studio-dev · 61997."
            : `Wrong wallet network (${chainId}). Switch to Studio-dev · 61997 before evaluating.`,
        };
      });
    }).catch(error => {
      if (walletProviderRef.current !== provider) return;
      setState(previous => ({
        ...previous,
        walletChainId: null,
        walletReady: false,
        notice: error instanceof Error ? error.message : "Unable to verify the wallet network.",
      }));
    });
  }, []);

  const connect = async () => {
    const provider = walletProviderRef.current;
    if (!provider) {
      setState(previous => ({ ...previous, notice: "Open the wallet connection dialog to connect a Studio-dev wallet." }));
      return;
    }
    try {
      const result = await connectStudioDev(provider);
      setWalletSession(result.account, provider);
    } catch (error) {
      setState(previous => ({ ...previous, walletReady: false, notice: error instanceof Error ? error.message : "Wallet connection failed." }));
    }
  };

  const evaluate = async () => {
    if (state.status === "submitting") return;
    const provider = walletProviderRef.current;
    if (!CONTRACT) {
      setState(previous => ({ ...previous, notice: "A fresh Studio Next contract address is required before semantic evaluation." }));
      return;
    }
    if (!hashesReady || !state.evaluationHash) {
      setState(previous => ({ ...previous, notice: "Calculating semantic hash…" }));
      return;
    }
    if (evaluationFinalized) {
      setState(previous => ({ ...previous, notice: "Current interpretation already evaluated. Apply an amendment before evaluating again." }));
      return;
    }
    if (!provider || !state.wallet) {
      setState(previous => ({ ...previous, notice: "Connect a Studio-dev wallet before evaluating meaning." }));
      return;
    }
    if (!state.walletReady || state.walletChainId !== studioDevConfig.chainId) {
      setState(previous => ({ ...previous, notice: `Wrong wallet network. Switch to Studio-dev · ${studioDevConfig.chainId} before evaluating.` }));
      return;
    }
    const request = ++evaluationRequestRef.current;
    const requestVersion = state.semanticVersion;
    const requestAgreementId = state.agreementId;
    const requestEvaluationHash = state.evaluationHash;
    const requestPartyA = partyA;
    const requestPartyB = partyB;
    setState(previous => ({
      ...previous,
      outcome: "UNRESOLVED",
      status: "submitting",
      verdictHash: "",
      tx: "",
      ratifications: { a: "", b: "" },
      receipt: null,
      notice: "Submitting semantic question to GenLayer validators…",
    }));
    try {
      const result = await submitConsensus(provider, CONTRACT as `0x${string}`, {
        agreementId: requestAgreementId,
        inputHash: requestEvaluationHash,
        buyerInterpretation: requestPartyA,
        sellerInterpretation: requestPartyB,
        question: QUESTION,
      });
      setState(previous => {
        const current = isEvaluationRequestCurrent({
          requestId: request,
          currentRequestId: evaluationRequestRef.current,
          requestVersion,
          currentVersion: previous.semanticVersion,
          agreementId: requestAgreementId,
          currentAgreementId: previous.agreementId,
          evaluationHash: requestEvaluationHash,
          currentEvaluationHash: previous.evaluationHash,
        });
        if (!current) return { ...previous, status: previous.status === "submitting" ? "idle" : previous.status, notice: "A stale semantic result was safely discarded." };
        return {
          ...previous,
          outcome: result.outcome,
          verdictHash: requestEvaluationHash,
          tx: result.transactionHash,
          status: "finalized",
          notice: result.outcome === "EQUIVALENT" ? "Validator consensus established material equivalence." : "Formation is blocked until these obligations converge.",
        };
      });
    } catch (error) {
      setState(previous => {
        const current = isEvaluationRequestCurrent({
          requestId: request,
          currentRequestId: evaluationRequestRef.current,
          requestVersion,
          currentVersion: previous.semanticVersion,
          agreementId: requestAgreementId,
          currentAgreementId: previous.agreementId,
          evaluationHash: requestEvaluationHash,
          currentEvaluationHash: previous.evaluationHash,
        });
        if (!current) return { ...previous, status: previous.status === "submitting" ? "idle" : previous.status, notice: "A stale semantic error was safely discarded." };
        return { ...previous, status: "error", notice: error instanceof Error ? error.message : "GenLayer transaction failed." };
      });
    }
  };

  const ratify = (party: string) => {
    setState(previous => {
      const currentReady = previous.canonicalHashStatus === "ready"
        && previous.evaluationHashStatus === "ready"
        && canForm(previous.outcome, conflicts, previous.canonicalHash, previous.canonicalHash, previous.evaluationHash, previous.verdictHash)
        && previous.status === "finalized"
        && Boolean(previous.tx)
        && previous.evaluationHash === previous.verdictHash;
      if (!currentReady) return { ...previous, notice: "Ratification is locked until an equivalent, current GenLayer verdict is finalized." };
      const next = party === previous.partyAName
        ? { ...previous.ratifications, a: previous.canonicalHash }
        : party === previous.partyBName
          ? { ...previous.ratifications, b: previous.canonicalHash }
          : previous.ratifications;
      const nextReceipt = next.a === previous.canonicalHash
        && next.b === previous.canonicalHash
        ? createFormationReceipt({
          agreementId: previous.agreementId,
          canonicalAgreementHash: previous.canonicalHash,
          evaluationInputHash: previous.verdictHash,
          verdict: previous.outcome,
          transactionHash: previous.tx,
          contractAddress: CONTRACT,
          network: "Studio-dev",
          partyARatifiedHash: next.a,
          partyBRatifiedHash: next.b,
          policyVersion: model.policyVersion,
          formedAt: previous.receipt?.formedAt ?? new Date().toISOString(),
        }) : null;
      return {
        ...previous,
        ratifications: next,
        receipt: nextReceipt || previous.receipt,
        notice: `${party} ratified the exact canonical hash.`,
      };
    });
  };

  return <FormationContext.Provider value={{
    ...state,
    partyA,
    partyB,
    partyAObligations,
    partyBObligations,
    conflicts,
    hashesReady,
    evaluationReady,
    evaluationFinalized,
    ready,
    formed,
    life,
    model,
    reset,
    configureDraft,
    amend,
    connect,
    setWalletSession,
    evaluate,
    ratify,
  }}>{children}</FormationContext.Provider>;
}

export function useFormation() {
  const context = useContext(FormationContext);
  if (!context) throw new Error("useFormation must be used inside FormationProvider");
  return context;
}

export { QUESTION, CONTRACT };
