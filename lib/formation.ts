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

export function deterministicConflicts(a: ObligationModel, b: ObligationModel): string[] {
  const conflicts: string[] = [];
  if (a.quantity !== b.quantity) conflicts.push("quantity");
  if (a.deadline !== b.deadline) conflicts.push("deadline");
  if (a.evidence !== b.evidence) conflicts.push("evidence");
  return conflicts;
}

export function canForm(outcome: SemanticOutcome, deterministic: string[], aHash?: string, bHash?: string): boolean {
  return outcome === "EQUIVALENT" && deterministic.length === 0 && !!aHash && aHash === bHash;
}
