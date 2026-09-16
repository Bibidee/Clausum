export type SemanticOutcome = "EQUIVALENT" | "MATERIAL_CONFLICT" | "UNRESOLVED";
export type FormationStatus = "DRAFT" | "CONFLICT" | "READY" | "RATIFICATION_PENDING" | "FORMED";

export interface ObligationModel {
  scope: string;
  evidence: string;
  deadline: string;
  quantity: number;
}

export interface CanonicalAgreement {
  parties: readonly string[];
  obligations: ObligationModel;
  policyVersion: string;
}

export interface FormationReceipt {
  agreementId: string;
  canonicalAgreementHash: string;
  evaluationInputHash: string;
  verdict: SemanticOutcome;
  transactionHash: string;
  contractAddress: string;
  network: string;
  partyARatifiedHash: string;
  partyBRatifiedHash: string;
  policyVersion: string;
  formedAt: string;
}

export interface ReceiptEvidence {
  agreementId: string;
  canonicalHash: string;
  evaluationHash: string;
  verdictHash: string;
  transactionHash: string;
  contractAddress: string;
  network: string;
  policyVersion: string;
}

export const EVALUATION_HASH_VERSION = "EvaluationHashV1";
export const POLICY_VERSION = "0.1";
export const VERSION_COMMITMENT_VERSION = "VersionCommitmentV1";

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export async function canonicalHash(value: CanonicalAgreement): Promise<string> {
  const bytes = new TextEncoder().encode(stableStringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function evaluationHashPayload(value: { agreementId: string; partyA: string; partyB: string; question: string; policyVersion: string }): string {
  const fields = [value.agreementId, value.partyA, value.partyB, value.question, value.policyVersion];
  const encoder = new TextEncoder();
  return `${EVALUATION_HASH_VERSION}|${fields.map(field => `${encoder.encode(field).length}:${field}`).join("")}`;
}

export async function evaluationInputHash(value: { agreementId: string; partyA: string; partyB: string; question: string; policyVersion: string }): Promise<string> {
  const bytes = new TextEncoder().encode(evaluationHashPayload(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function versionCommitmentPayload(value: { agreementId: string; revision: string; party: "a" | "b"; semanticTerms: string; scope: string; evidence: string; deadline: string; quantity: string; policyVersion?: string }): string {
  const fields = [value.agreementId, value.revision, value.party, value.scope, value.evidence, value.deadline, value.quantity, value.semanticTerms, value.policyVersion ?? POLICY_VERSION];
  const encoder = new TextEncoder();
  return `${VERSION_COMMITMENT_VERSION}|${fields.map(field => `${encoder.encode(field).length}:${field}`).join("")}`;
}

export async function versionCommitmentHash(value: { agreementId: string; revision: string; party: "a" | "b"; semanticTerms: string; scope: string; evidence: string; deadline: string; quantity: string; policyVersion?: string }): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(versionCommitmentPayload(value)));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function isEvaluationHashBound(expected: string, supplied: string): boolean {
  return supplied.length === 64 && supplied.toLowerCase() === expected.toLowerCase() && /^[0-9a-fA-F]{64}$/.test(supplied);
}

export function createFormationReceipt(input: FormationReceipt): FormationReceipt | null {
  if (input.verdict !== "EQUIVALENT" || !input.transactionHash || !input.contractAddress || !input.canonicalAgreementHash || !input.evaluationInputHash || input.canonicalAgreementHash !== input.partyARatifiedHash || input.canonicalAgreementHash !== input.partyBRatifiedHash) return null;
  return { ...input };
}

export function isFormationReceiptConsistent(receipt: FormationReceipt | null, evidence: ReceiptEvidence): receipt is FormationReceipt {
  if (!receipt) return false;
  return receipt.verdict === "EQUIVALENT"
    && receipt.agreementId === evidence.agreementId
    && receipt.canonicalAgreementHash === evidence.canonicalHash
    && receipt.canonicalAgreementHash === receipt.partyARatifiedHash
    && receipt.canonicalAgreementHash === receipt.partyBRatifiedHash
    && receipt.evaluationInputHash === evidence.evaluationHash
    && receipt.evaluationInputHash === evidence.verdictHash
    && receipt.transactionHash === evidence.transactionHash
    && receipt.transactionHash.length > 0
    && receipt.contractAddress === evidence.contractAddress
    && receipt.contractAddress.length > 0
    && receipt.network === evidence.network
    && receipt.policyVersion === evidence.policyVersion
    && Boolean(receipt.formedAt);
}

export function isEvaluationFinalized(input: {
  status: string;
  evaluationHash: string;
  verdictHash: string;
  transactionHash: string;
  hashesReady: boolean;
}): boolean {
  return input.status === "finalized"
    && input.hashesReady
    && Boolean(input.transactionHash)
    && Boolean(input.evaluationHash)
    && input.evaluationHash === input.verdictHash;
}

export function canEvaluateCurrentInput(input: {
  hashesReady: boolean;
  evaluationFinalized: boolean;
  submitting: boolean;
  contractConfigured: boolean;
  providerAvailable: boolean;
  walletReady: boolean;
  walletChainId: number | null;
  requiredChainId: number;
}): boolean {
  return input.hashesReady
    && !input.evaluationFinalized
    && !input.submitting
    && input.contractConfigured
    && input.providerAvailable
    && input.walletReady
    && input.walletChainId === input.requiredChainId;
}

export function isEvaluationRequestCurrent(input: {
  requestId: number;
  currentRequestId: number;
  requestVersion: number;
  currentVersion: number;
  agreementId: string;
  currentAgreementId: string;
  evaluationHash: string;
  currentEvaluationHash: string;
}): boolean {
  return input.requestId === input.currentRequestId
    && input.requestVersion === input.currentVersion
    && input.agreementId === input.currentAgreementId
    && input.evaluationHash === input.currentEvaluationHash;
}

export function deterministicConflicts(a: ObligationModel, b: ObligationModel): string[] {
  const conflicts: string[] = [];
  if (a.scope !== b.scope) conflicts.push("scope");
  if (a.quantity !== b.quantity) conflicts.push("quantity");
  if (a.deadline !== b.deadline) conflicts.push("deadline");
  if (a.evidence !== b.evidence) conflicts.push("evidence");
  return conflicts;
}

export function canForm(outcome: SemanticOutcome, deterministic: string[], aHash?: string, bHash?: string, currentEvaluationHash?: string, verdictEvaluationHash?: string): boolean {
  return outcome === "EQUIVALENT" && deterministic.length === 0 && !!aHash && aHash === bHash && (!currentEvaluationHash || currentEvaluationHash === verdictEvaluationHash);
}
