"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  canForm,
  canEvaluateCurrentInput,
  canonicalHash,
  contractCanonicalHash,
  contractEvaluationInputHash,
  createFormationReceipt,
  deterministicConflicts,
  evaluationInputHash,
  isFormationReceiptConsistent,
  isEvaluationFinalized,
  isEvaluationRequestCurrent,
  stableStringify,
  versionCommitmentHash,
  type FormationReceipt,
  type ObligationModel,
  type SemanticOutcome,
} from "./formation";
import { connectStudioDev, createNegotiation, evaluateNegotiation, isStudioDevChain, ratifyNegotiation, readFormationState, readProviderChainId, reviseNegotiation, studioDevConfig, submitConsensus, submitPartyVersionFromTerms, switchToStudioDev, type Eip1193Provider } from "./genlayer";

const QUESTION = "Do these interpretations establish materially equivalent obligations?";
const CONTRACT = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "";
const CONTRACT_MODE = process.env.NEXT_PUBLIC_CLAUSUM_MODE === "contract";
function describeWalletError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const details = error as { shortMessage?: unknown; message?: unknown; details?: unknown };
    for (const value of [details.shortMessage, details.message, details.details]) {
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return "GenLayer transaction failed.";
}
export function createAgreementId(randomUUID?: () => string): string {
  const uuid = randomUUID ?? globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (uuid) return `AG-${uuid().toUpperCase()}`;
  if (!globalThis.crypto?.getRandomValues) throw new Error("Secure randomness is required for agreement IDs.");
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return `AG-${Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export type HashStatus = "idle" | "calculating" | "ready";

export interface FormationState {
  agreementId: string;
  agreementTitle: string;
  partyAName: string;
  partyBName: string;
  partyBAddress: string;
  partyAInterpretation: string;
  partyBInterpretation: string;
  chainRevision: number;
  chainCreated: boolean;
  chainVersions: { a: boolean; b: boolean };
  obligations: ObligationModel;
  partyBObligations: ObligationModel;
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
  authoritativeRead: { state: string; verdict: string; canonicalHash: string; partyARatifiedHash: string; partyBRatifiedHash: string; partyAAddress: string; partyBAddress: string; receipt: string; readAt: string } | null;
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
  configureDraft: (draft: { title: string; partyAName: string; partyBName: string; partyBAddress: string; partyAInterpretation?: string; partyBInterpretation?: string; obligations: ObligationModel; partyBObligations?: ObligationModel }) => void;
  amend: () => void;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  setWalletSession: (wallet: string | null, provider: Eip1193Provider | null) => void;
  evaluate: () => Promise<void>;
  ratify: (party: "a" | "b") => void | Promise<void>;
  submitVersion: (party: "a" | "b") => Promise<void>;
  contractMode: boolean;
  refreshAuthoritativeState: () => Promise<void>;
}

const FormationContext = createContext<FormationContextValue | null>(null);

export function initialState(agreementId = createAgreementId()): FormationState {
  return {
    agreementId,
    agreementTitle: "European provider intelligence report",
    partyAName: "Atlas Procurement",
    partyBName: "Meridian Research",
    partyBAddress: "",
    partyAInterpretation: "Produce a competitor report covering the five largest European providers, using public sources, by Friday at 17:00.",
    partyBInterpretation: "Produce a competitor report covering the five largest European providers, using public sources, by Friday at 17:00.",
    chainRevision: 1,
    chainCreated: false,
    chainVersions: { a: false, b: false },
    obligations: {
      scope: "five largest EU providers by revenue",
      evidence: "two independent public sources",
      deadline: "Friday 17:00 CET",
      quantity: 5,
    },
    partyBObligations: {
      scope: "five largest EU providers by revenue",
      evidence: "one public source",
      deadline: "Friday 17:00 UTC",
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
    authoritativeRead: null,
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
    authoritativeRead: null,
  };
}

export function resetFormationState(previous: FormationState): FormationState {
  return {
    ...initialState(),
    wallet: previous.wallet,
    walletChainId: previous.walletChainId,
    walletReady: previous.walletReady,
    semanticVersion: previous.semanticVersion + 1,
  };
}

export function configureDraftState(previous: FormationState, draft: { title: string; partyAName: string; partyBName: string; partyBAddress?: string; partyAInterpretation?: string; partyBInterpretation?: string; obligations: ObligationModel; partyBObligations?: ObligationModel }): FormationState {
  return {
    ...clearRuntime(previous, previous.semanticVersion + 1),
    agreementId: createAgreementId(),
    agreementTitle: draft.title.trim() || "Untitled agreement",
    partyAName: draft.partyAName.trim() || "Party A",
    partyBName: draft.partyBName.trim() || "Party B",
    partyBAddress: draft.partyBAddress?.trim() ?? "",
    partyAInterpretation: draft.partyAInterpretation?.trim() ?? "",
    partyBInterpretation: draft.partyBInterpretation?.trim() || draft.partyAInterpretation?.trim() || "",
    chainRevision: 1,
    chainCreated: false,
    chainVersions: { a: false, b: false },
    obligations: draft.obligations,
    partyBObligations: draft.partyBObligations ?? {
      ...draft.obligations,
      evidence: "one public source",
      deadline: "Friday 17:00 UTC",
    },
    stage: "conflict",
    notice: "Guided demo draft ready. Review both interpretations, then evaluate meaning.",
  };
}

export function amendFormationState(previous: FormationState): FormationState {
  return {
    ...clearRuntime(previous, previous.semanticVersion + 1),
    chainRevision: previous.chainRevision + 1,
    chainVersions: { a: false, b: false },
    partyBObligations: previous.obligations,
    stage: "ready",
    notice: "Guided demo amendment applied. Previous semantic verdict invalidated; re-evaluation is required.",
  };
}

export function ratifyFormationState(previous: FormationState, party: "a" | "b", conflicts: string[], contract: string, policyVersion: string): FormationState {
  const currentReady = previous.canonicalHashStatus === "ready"
    && previous.evaluationHashStatus === "ready"
    && canForm(previous.outcome, conflicts, previous.canonicalHash, previous.canonicalHash, previous.evaluationHash, previous.verdictHash)
    && previous.status === "finalized"
    && Boolean(previous.tx)
    && previous.evaluationHash === previous.verdictHash;
  if (!currentReady) return { ...previous, notice: "Ratification is locked until an equivalent, current GenLayer verdict is finalized." };
  const ratifications = { ...previous.ratifications, [party]: previous.canonicalHash };
  const receipt = ratifications.a === previous.canonicalHash && ratifications.b === previous.canonicalHash
    ? createFormationReceipt({
      agreementId: previous.agreementId,
      canonicalAgreementHash: previous.canonicalHash,
      evaluationInputHash: previous.verdictHash,
      verdict: previous.outcome,
      transactionHash: previous.tx,
      contractAddress: contract,
      network: "Studio-dev",
      partyARatifiedHash: ratifications.a,
      partyBRatifiedHash: ratifications.b,
      policyVersion,
      formedAt: previous.receipt?.formedAt ?? new Date().toISOString(),
    }) : null;
  return { ...previous, ratifications, receipt: receipt || previous.receipt, notice: `Party ${party.toUpperCase()} ratified the exact canonical hash.` };
}

export function FormationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormationState>(() => initialState(""));
  const [hydrated, setHydrated] = useState(false);
  const walletProviderRef = useRef<Eip1193Provider | null>(null);
  const walletListenersRef = useRef<{ provider: Eip1193Provider; chain: (...args: unknown[]) => void; accounts: (...args: unknown[]) => void } | null>(null);
  const hashRequestRef = useRef(0);
  const evaluationRequestRef = useRef(0);
  const model = useMemo(() => ({
    parties: [state.partyAName, state.partyBName],
    obligations: state.obligations,
    policyVersion: "0.1",
  }), [state.partyAName, state.partyBName, state.obligations]);
  const partyAObligations = model.obligations;
  const partyBObligations = state.partyBObligations;
  const partyA = useMemo(() => state.partyAInterpretation.trim() || stableStringify(partyAObligations), [partyAObligations, state.partyAInterpretation]);
  const partyB = useMemo(() => state.partyBInterpretation.trim() || stableStringify(partyBObligations), [partyBObligations, state.partyBInterpretation]);
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
    if (!saved) { setState(initialState()); setHydrated(true); return; }
    try {
      const parsed = JSON.parse(saved) as Partial<FormationState>;
      setState(previous => {
        const restored = { ...previous, ...parsed } as FormationState;
        const safe = parsed.agreementId === "AG-DEMO" || !parsed.agreementId
          ? clearRuntime({ ...restored, agreementId: createAgreementId() }, restored.semanticVersion + 1)
          : restored;
        return {
          ...safe,
          partyBAddress: typeof safe.partyBAddress === "string" ? safe.partyBAddress : "",
          partyAInterpretation: typeof safe.partyAInterpretation === "string" ? safe.partyAInterpretation : "",
          partyBInterpretation: typeof safe.partyBInterpretation === "string" ? safe.partyBInterpretation : "",
          partyBObligations: safe.partyBObligations && typeof safe.partyBObligations === "object"
            ? {
              scope: typeof safe.partyBObligations.scope === "string" ? safe.partyBObligations.scope : safe.obligations.scope,
              evidence: typeof safe.partyBObligations.evidence === "string" ? safe.partyBObligations.evidence : "one public source",
              deadline: typeof safe.partyBObligations.deadline === "string" ? safe.partyBObligations.deadline : "Friday 17:00 UTC",
              quantity: Number.isFinite(safe.partyBObligations.quantity) ? safe.partyBObligations.quantity : safe.obligations.quantity,
            }
            : {
              ...safe.obligations,
              evidence: "one public source",
              deadline: "Friday 17:00 UTC",
            },
          chainRevision: Number.isInteger(safe.chainRevision) && safe.chainRevision > 0 ? safe.chainRevision : 1,
          chainCreated: Boolean(safe.chainCreated),
          chainVersions: { a: Boolean(safe.chainVersions?.a), b: Boolean(safe.chainVersions?.b) },
          status: safe.status === "submitting" ? "idle" : safe.status,
          canonicalHash: "",
          evaluationHash: "",
          canonicalHashStatus: "idle",
          evaluationHashStatus: "idle",
          authoritativeRead: null,
          wallet: null,
          walletChainId: null,
          walletReady: false,
        };
      });
    } catch {
      setState(initialState());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") window.sessionStorage.setItem("clausum-formation", JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || !state.agreementId) return;
    const request = ++hashRequestRef.current;
    const requestVersion = state.semanticVersion;
    setState(previous => ({
      ...previous,
      canonicalHash: "",
      evaluationHash: "",
      canonicalHashStatus: "calculating",
      evaluationHashStatus: "calculating",
    }));
    const canonicalTask = CONTRACT_MODE
      ? Promise.all([
        versionCommitmentHash({ agreementId: input.agreementId, revision: String(state.chainRevision), party: "a", semanticTerms: partyA, scope: partyAObligations.scope, evidence: partyAObligations.evidence, deadline: partyAObligations.deadline, quantity: String(partyAObligations.quantity) }),
        versionCommitmentHash({ agreementId: input.agreementId, revision: String(state.chainRevision), party: "b", semanticTerms: partyB, scope: partyBObligations.scope, evidence: partyBObligations.evidence, deadline: partyBObligations.deadline, quantity: String(partyBObligations.quantity) }),
      ]).then(([commitA, commitB]) => contractCanonicalHash({ agreementId: input.agreementId, revision: String(state.chainRevision), partyACommitment: commitA, partyBCommitment: commitB, policyVersion: model.policyVersion }))
      : canonicalHash(model);
    const evaluationTask = CONTRACT_MODE
      ? contractEvaluationInputHash({ agreementId: input.agreementId, revision: String(state.chainRevision), partyA, partyB, policyVersion: model.policyVersion })
      : evaluationInputHash(input);
    void Promise.all([canonicalTask, evaluationTask]).then(([nextCanonicalHash, nextEvaluationHash]) => {
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
  }, [hydrated, input, model, partyA, partyB, partyAObligations, partyBObligations, state.agreementId, state.chainRevision, state.semanticVersion]);

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
  const localReady = hashesReady
    && state.status === "finalized"
    && Boolean(state.tx)
    && canForm(state.outcome, conflicts, state.canonicalHash, state.canonicalHash, state.evaluationHash, state.verdictHash);
  const contractReady = CONTRACT_MODE && state.authoritativeRead?.state === "READY" && state.authoritativeRead.verdict === "EQUIVALENT";
  const ready = CONTRACT_MODE ? Boolean(contractReady) : localReady;
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
  const formed = (CONTRACT_MODE ? state.authoritativeRead?.state === "FORMED" : ready)
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
    setState(resetFormationState);
  };

  const configureDraft = (draft: { title: string; partyAName: string; partyBName: string; partyBAddress: string; partyAInterpretation?: string; partyBInterpretation?: string; obligations: ObligationModel; partyBObligations?: ObligationModel }) => {
    if (state.status === "submitting") {
      setState(previous => ({ ...previous, notice: "Wait for the current semantic evaluation to finish." }));
      return;
    }
    evaluationRequestRef.current += 1;
    setState(previous => configureDraftState(previous, draft));
  };

  const amend = async () => {
    if (state.status === "submitting") {
      setState(previous => ({ ...previous, notice: "Wait for the current semantic evaluation to finish." }));
      return;
    }
    evaluationRequestRef.current += 1;
    if (CONTRACT_MODE) {
      const provider = walletProviderRef.current;
      if (!provider || !state.wallet || !state.walletReady) { setState(previous => ({ ...previous, notice: "Connect Party A's Studio-dev wallet before amending." })); return; }
      const partyAAddress = state.authoritativeRead?.partyAAddress;
      if ((partyAAddress && state.wallet.toLowerCase() !== partyAAddress.toLowerCase())
        || (!partyAAddress && state.wallet.toLowerCase() === state.partyBAddress.toLowerCase())) {
        setState(previous => ({ ...previous, notice: "Connect Party A's authorized Studio-dev wallet before amending." }));
        return;
      }
      try {
        await reviseNegotiation(provider, CONTRACT as `0x${string}`, state.agreementId, state.wallet);
        setState(amendFormationState);
      } catch (error) { setState(previous => ({ ...previous, notice: describeWalletError(error) })); }
      return;
    }
    setState(amendFormationState);
  };

  const setWalletSession = useCallback((wallet: string | null, provider: Eip1193Provider | null) => {
    if (walletListenersRef.current && walletListenersRef.current.provider !== provider) {
      const previous = walletListenersRef.current;
      previous.provider.removeListener?.("chainChanged", previous.chain);
      previous.provider.removeListener?.("accountsChanged", previous.accounts);
      walletListenersRef.current = null;
    }
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
    if (provider.on && !walletListenersRef.current) {
      const chain = (raw: unknown) => { const chainId = typeof raw === "string" ? Number.parseInt(raw, 16) : null; setState(previous => ({ ...previous, walletChainId: Number.isFinite(chainId) ? chainId : null, walletReady: isStudioDevChain(Number.isFinite(chainId) ? chainId : null) })); };
      const accounts = (raw: unknown) => { const next = Array.isArray(raw) ? raw[0] : null; if (typeof next !== "string") setState(previous => ({ ...previous, wallet: null, walletReady: false, walletChainId: null, notice: "Wallet disconnected." })); };
      provider.on("chainChanged", chain); provider.on("accountsChanged", accounts); walletListenersRef.current = { provider, chain, accounts };
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

  const switchNetwork = async () => {
    const provider = walletProviderRef.current;
    if (!provider) { setState(previous => ({ ...previous, notice: "Connect a wallet before switching networks." })); return; }
    try {
      const chainId = await switchToStudioDev(provider);
      setState(previous => ({ ...previous, walletChainId: chainId, walletReady: true, notice: "Wallet connected to Studio-dev · 61997." }));
    } catch (error) {
      setState(previous => ({ ...previous, walletReady: false, notice: error instanceof Error ? error.message : "Unable to switch to Studio-dev." }));
    }
  };

  const submitVersion = async (party: "a" | "b") => {
    if (!CONTRACT_MODE) { setState(previous => ({ ...previous, notice: "Contract submission is available when CLAUSUM is configured in contract mode." })); return; }
    const provider = walletProviderRef.current;
    if (!provider || !state.wallet || !state.walletReady) { setState(previous => ({ ...previous, notice: "Connect the authorized Studio-dev wallet before submitting a version." })); return; }
    if (party === "b" && state.wallet.toLowerCase() !== state.partyBAddress.toLowerCase()) { setState(previous => ({ ...previous, notice: "Connect Party B's authorized wallet to submit Party B's version." })); return; }
    if (party === "a" && state.wallet.toLowerCase() === state.partyBAddress.toLowerCase()) { setState(previous => ({ ...previous, notice: "Party A must submit from the Party A wallet." })); return; }
    try {
      if (party === "a" && !state.chainCreated) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(state.partyBAddress)) throw new Error("Enter Party B's wallet address before creating the negotiation.");
        await createNegotiation(provider, CONTRACT as `0x${string}`, state.agreementId, state.partyBAddress as `0x${string}`, model.policyVersion, state.wallet);
        setState(previous => ({ ...previous, chainCreated: true }));
      }
      if (!state.chainCreated && party === "b") { setState(previous => ({ ...previous, notice: "Party A must create the negotiation before Party B can submit." })); return; }
      const obligations = party === "a" ? partyAObligations : partyBObligations;
      await submitPartyVersionFromTerms(provider, CONTRACT as `0x${string}`, {
        agreementId: state.agreementId,
        revision: String(state.chainRevision),
        party,
        semanticTerms: party === "a" ? partyA : partyB,
        scope: obligations.scope,
        evidence: obligations.evidence,
        deadline: obligations.deadline,
        quantity: String(obligations.quantity),
      }, state.wallet);
      setState(previous => ({ ...previous, chainVersions: { ...previous.chainVersions, [party]: true }, notice: `Party ${party.toUpperCase()} version committed on Studio-dev.` }));
    } catch (error) { setState(previous => ({ ...previous, notice: describeWalletError(error) })); }
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
    if (CONTRACT_MODE && (!state.chainCreated || !state.chainVersions.a || !state.chainVersions.b)) {
      setState(previous => ({ ...previous, notice: "Commit both authorized party versions before requesting GenLayer judgment." }));
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
      const result = CONTRACT_MODE
        ? await evaluateNegotiation(provider, CONTRACT as `0x${string}`, requestAgreementId, String(state.chainRevision), state.wallet ?? undefined)
        : await submitConsensus(provider, CONTRACT as `0x${string}`, {
          agreementId: requestAgreementId,
          inputHash: requestEvaluationHash,
          buyerInterpretation: requestPartyA,
          sellerInterpretation: requestPartyB,
          question: QUESTION,
        }, state.wallet ?? undefined);
      const authoritative = CONTRACT_MODE ? await readFormationState(provider, CONTRACT as `0x${string}`, requestAgreementId, state.wallet ?? undefined) : null;
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
          authoritativeRead: authoritative ? { ...authoritative, readAt: new Date().toISOString() } : previous.authoritativeRead,
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
        return { ...previous, status: "error", notice: describeWalletError(error) };
      });
    }
  };

  const ratify = async (party: "a" | "b") => {
    if (!CONTRACT_MODE) { setState(previous => ratifyFormationState(previous, party, conflicts, CONTRACT, model.policyVersion)); return; }
    const provider = walletProviderRef.current;
    if (!provider || !state.wallet || !state.walletReady) { setState(previous => ({ ...previous, notice: "Connect the authorized Studio-dev wallet before ratifying." })); return; }
    const expected = party === "a" ? state.authoritativeRead?.partyAAddress : state.partyBAddress;
    if (!expected || state.wallet.toLowerCase() !== expected.toLowerCase()) { setState(previous => ({ ...previous, notice: `Connect Party ${party.toUpperCase()}'s authorized wallet to ratify.` })); return; }
    if (!state.canonicalHash || !state.authoritativeRead || state.authoritativeRead.state !== "READY") { setState(previous => ({ ...previous, notice: "The contract is not ready for ratification." })); return; }
    try {
      await ratifyNegotiation(provider, CONTRACT as `0x${string}`, state.agreementId, state.authoritativeRead.canonicalHash || state.canonicalHash, state.wallet);
      const read = await readFormationState(provider, CONTRACT as `0x${string}`, state.agreementId, state.wallet);
      setState(previous => {
        const parsed = read.parsedReceipt;
        const nextReceipt = read.state === "FORMED" && parsed ? createFormationReceipt({ agreementId: parsed.agreementId, canonicalAgreementHash: parsed.canonicalAgreementHash, evaluationInputHash: parsed.evaluationInputHash, verdict: parsed.verdict as SemanticOutcome, transactionHash: previous.tx, contractAddress: CONTRACT, network: "Studio-dev", partyARatifiedHash: parsed.partyARatifiedHash, partyBRatifiedHash: parsed.partyBRatifiedHash, policyVersion: parsed.policyVersion, formedAt: previous.receipt?.formedAt ?? new Date().toISOString() }) : previous.receipt;
        return { ...previous, authoritativeRead: { ...read, readAt: new Date().toISOString() }, ratifications: { a: read.partyARatifiedHash, b: read.partyBRatifiedHash }, receipt: nextReceipt, notice: `Party ${party.toUpperCase()} ratification finalized on Studio-dev.` };
      });
    } catch (error) { setState(previous => ({ ...previous, notice: describeWalletError(error) })); }
  };

  const refreshAuthoritativeState = async () => {
    const provider = walletProviderRef.current;
    if (!provider || !CONTRACT || !state.agreementId) {
      setState(previous => ({ ...previous, notice: "Connect a wallet and configure the contract before reading authoritative state." }));
      return;
    }
    try {
      const read = await readFormationState(provider, CONTRACT as `0x${string}`, state.agreementId, state.wallet ?? undefined);
      setState(previous => ({ ...previous, authoritativeRead: { ...read, readAt: new Date().toISOString() }, notice: "Fresh contract state read completed." }));
    } catch (error) {
      setState(previous => ({ ...previous, notice: describeWalletError(error) }));
    }
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
    switchNetwork,
    setWalletSession,
    evaluate,
    ratify,
    submitVersion,
    contractMode: CONTRACT_MODE,
    refreshAuthoritativeState,
  }}>{children}</FormationContext.Provider>;
}

export function useFormation() {
  const context = useContext(FormationContext);
  if (!context) throw new Error("useFormation must be used inside FormationProvider");
  return context;
}

export { QUESTION, CONTRACT };
