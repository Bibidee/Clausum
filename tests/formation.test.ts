import test from "node:test";
import assert from "node:assert/strict";
import { canEvaluateCurrentInput, canForm, canonicalHash, createFormationReceipt, deterministicConflicts, evaluationHashPayload, evaluationInputHash, isEvaluationFinalized, isEvaluationHashBound, isEvaluationRequestCurrent, isFormationReceiptConsistent, stableStringify } from "../lib/formation";
import { clearRuntime, initialState } from "../lib/formation-context";
import { isStudioDevChain, parseChainId, readProviderChainId, STUDIO_DEV_CHAIN_ID_HEX } from "../lib/genlayer";

const base = { scope: "EU providers by revenue", evidence: "two sources", deadline: "Friday 17:00 CET", quantity: 5 };
test("canonicalization makes equivalent objects hash equally", async () => {
  const first = { parties: ["A", "B"], obligations: base, policyVersion: "0.1" } as const;
  const second = { policyVersion: "0.1", obligations: { quantity: 5, deadline: "Friday 17:00 CET", evidence: "two sources", scope: "EU providers by revenue" }, parties: ["A", "B"] } as const;
  assert.equal(stableStringify(first), stableStringify(second));
  assert.equal(await canonicalHash(first), await canonicalHash(second));
});
test("deterministic comparator detects scope, deadline, quantity, and evidence mismatches", () => {
  assert.deepEqual(deterministicConflicts(base, { ...base, scope: "different scope" }), ["scope"]);
  assert.deepEqual(deterministicConflicts(base, base), []);
  assert.deepEqual(deterministicConflicts(base, { ...base, deadline: "Friday 17:00 UTC" }), ["deadline"]);
  assert.deepEqual(deterministicConflicts(base, { ...base, quantity: 6, evidence: "one source" }), ["quantity", "evidence"]);
});
test("formation requires equivalence, no deterministic conflicts, and matching ratifications", () => {
  assert.equal(canForm("UNRESOLVED", [], "a", "a"), false);
  assert.equal(canForm("MATERIAL_CONFLICT", [], "a", "a"), false);
  assert.equal(canForm("EQUIVALENT", ["deadline"], "a", "a"), false);
  assert.equal(canForm("EQUIVALENT", [], "a", "b"), false);
  assert.equal(canForm("EQUIVALENT", [], "a", "a"), true);
});

test("a stale verdict and changed canonical agreement cannot form", async () => {
  const one = { agreementId: "AG-1", partyA: "a", partyB: "b", question: "q", policyVersion: "0.1" };
  const two = { ...one, partyB: "changed" };
  const firstHash = await evaluationInputHash(one);
  const secondHash = await evaluationInputHash(two);
  assert.notEqual(firstHash, secondHash);
  assert.equal(canForm("EQUIVALENT", [], "canonical-a", "canonical-a", secondHash, firstHash), false);
});

test("unresolved and conflict verdicts block matching ratifications", () => {
  assert.equal(canForm("UNRESOLVED", [], "same", "same", "input", "input"), false);
  assert.equal(canForm("MATERIAL_CONFLICT", [], "same", "same", "input", "input"), false);
  assert.equal(canForm("EQUIVALENT", ["quantity"], "same", "same", "input", "input"), false);
});

test("each party must independently ratify the current canonical hash", () => {
  assert.equal(canForm("EQUIVALENT", [], "canonical", "", "input", "input"), false);
  assert.equal(canForm("EQUIVALENT", [], "", "canonical", "input", "input"), false);
  assert.equal(canForm("EQUIVALENT", [], "old", "canonical", "input", "input"), false);
  assert.equal(canForm("EQUIVALENT", [], "canonical", "canonical", "input", "input"), true);
});

test("evaluation hash is bound to an unambiguous semantic payload", async () => {
  const vector = { agreementId: "AG-VECTOR-1", partyA: "A", partyB: "B", question: "Q", policyVersion: "0.1" };
  assert.equal(evaluationHashPayload(vector), "EvaluationHashV1|11:AG-VECTOR-11:A1:B1:Q3:0.1");
  const expected = await evaluationInputHash(vector);
  assert.equal(expected, "eb7ef11644f03ee32be27ea965a4b63bfc9ca72a2506168b27d059b3f71bef26");
  assert.equal(isEvaluationHashBound(expected, expected), true);
  assert.equal(isEvaluationHashBound(expected, "f".repeat(64)), false);
  for (const field of ["agreementId", "partyA", "partyB", "question", "policyVersion"] as const) {
    const mutated = { ...vector, [field]: `${vector[field]}-changed` };
    assert.notEqual(await evaluationInputHash(mutated), expected, `${field} must affect the hash`);
  }
});

test("receipt is issued only for strict formation evidence and remains stable", () => {
  const baseReceipt = { agreementId: "AG-1", canonicalAgreementHash: "a", evaluationInputHash: "b", verdict: "EQUIVALENT" as const, transactionHash: "0xtx", contractAddress: "0xcontract", network: "Studio-dev", partyARatifiedHash: "a", partyBRatifiedHash: "a", policyVersion: "0.1", formedAt: "2026-01-01T00:00:00.000Z" };
  assert.equal(createFormationReceipt({ ...baseReceipt, verdict: "UNRESOLVED" }), null);
  const receipt = createFormationReceipt(baseReceipt);
  assert.deepEqual(receipt, baseReceipt);
  assert.equal(createFormationReceipt({ ...baseReceipt, partyBRatifiedHash: "different" }), null);
});

test("receipt consistency rejects stale canonical, evaluation, transaction, and contract evidence", () => {
  const receipt = createFormationReceipt({ agreementId: "AG-1", canonicalAgreementHash: "canonical", evaluationInputHash: "evaluation", verdict: "EQUIVALENT", transactionHash: "0xtx", contractAddress: "0xcontract", network: "Studio-dev", partyARatifiedHash: "canonical", partyBRatifiedHash: "canonical", policyVersion: "0.1", formedAt: "2026-01-01T00:00:00.000Z" });
  const evidence = { agreementId: "AG-1", canonicalHash: "canonical", evaluationHash: "evaluation", verdictHash: "evaluation", transactionHash: "0xtx", contractAddress: "0xcontract", network: "Studio-dev", policyVersion: "0.1" };
  assert.equal(isFormationReceiptConsistent(receipt, evidence), true);
  for (const key of Object.keys(evidence) as Array<keyof typeof evidence>) {
    assert.equal(isFormationReceiptConsistent(receipt, { ...evidence, [key]: "stale" }), false, `${key} must match the active runtime`);
  }
  assert.equal(isFormationReceiptConsistent(null, evidence), false);
});

test("an evaluation is finalized only for the current ready input", () => {
  const current = { status: "finalized", evaluationHash: "input", verdictHash: "input", transactionHash: "0xtx", hashesReady: true };
  assert.equal(isEvaluationFinalized(current), true);
  assert.equal(isEvaluationFinalized({ ...current, hashesReady: false }), false);
  assert.equal(isEvaluationFinalized({ ...current, evaluationHash: "new-input" }), false);
  assert.equal(isEvaluationFinalized({ ...current, transactionHash: "" }), false);
  assert.equal(isEvaluationFinalized({ ...current, status: "submitting" }), false);
});

test("late asynchronous results are discarded after reset, amendment, or hash change", () => {
  const current = { requestId: 2, currentRequestId: 2, requestVersion: 4, currentVersion: 4, agreementId: "AG-1", currentAgreementId: "AG-1", evaluationHash: "hash-a", currentEvaluationHash: "hash-a" };
  assert.equal(isEvaluationRequestCurrent(current), true);
  assert.equal(isEvaluationRequestCurrent({ ...current, currentRequestId: 3 }), false);
  assert.equal(isEvaluationRequestCurrent({ ...current, currentVersion: 5 }), false);
  assert.equal(isEvaluationRequestCurrent({ ...current, currentAgreementId: "AG-2" }), false);
  assert.equal(isEvaluationRequestCurrent({ ...current, currentEvaluationHash: "hash-b" }), false);
});

test("provider chain ID is checked independently of the Reown display", async () => {
  assert.equal(STUDIO_DEV_CHAIN_ID_HEX, "0xf22d");
  assert.equal(parseChainId("0xf22d"), 61997);
  assert.equal(parseChainId("61997"), 61997);
  assert.equal(isStudioDevChain(parseChainId("0xf22d")), true);
  assert.equal(isStudioDevChain(parseChainId("0x1")), false);
  assert.equal(await readProviderChainId({ request: async () => "0xf22d" }), 61997);
  await assert.rejects(readProviderChainId({ request: async () => "not-a-chain" }), /invalid chain ID/);
});

test("hash readiness and an exact Studio-dev wallet chain gate evaluation", () => {
  const current = { hashesReady: true, evaluationFinalized: false, submitting: false, contractConfigured: true, providerAvailable: true, walletReady: true, walletChainId: 61997, requiredChainId: 61997 };
  assert.equal(canEvaluateCurrentInput(current), true);
  assert.equal(canEvaluateCurrentInput({ ...current, hashesReady: false }), false);
  assert.equal(canEvaluateCurrentInput({ ...current, evaluationFinalized: true }), false);
  assert.equal(canEvaluateCurrentInput({ ...current, submitting: true }), false);
  assert.equal(canEvaluateCurrentInput({ ...current, providerAvailable: false }), false);
  assert.equal(canEvaluateCurrentInput({ ...current, walletChainId: 1 }), false);
});

test("reset and amendment invalidation clear all prior runtime proof state", () => {
  const previous = { ...initialState(), outcome: "EQUIVALENT" as const, status: "finalized" as const, canonicalHash: "old-canonical", evaluationHash: "old-input", canonicalHashStatus: "ready" as const, evaluationHashStatus: "ready" as const, verdictHash: "old-input", tx: "0xtx", ratifications: { a: "old-canonical", b: "old-canonical" }, receipt: createFormationReceipt({ agreementId: "AG-DEMO", canonicalAgreementHash: "old-canonical", evaluationInputHash: "old-input", verdict: "EQUIVALENT", transactionHash: "0xtx", contractAddress: "0xcontract", network: "Studio-dev", partyARatifiedHash: "old-canonical", partyBRatifiedHash: "old-canonical", policyVersion: "0.1", formedAt: "2026-01-01T00:00:00.000Z" }) };
  const amended = clearRuntime(previous, previous.semanticVersion + 1);
  for (const state of [amended, initialState()]) {
    assert.equal(state.outcome, "UNRESOLVED");
    assert.equal(state.status, "idle");
    assert.equal(state.canonicalHash, "");
    assert.equal(state.evaluationHash, "");
    assert.equal(state.verdictHash, "");
    assert.equal(state.tx, "");
    assert.deepEqual(state.ratifications, { a: "", b: "" });
    assert.equal(state.receipt, null);
    assert.notEqual(state.canonicalHashStatus, "ready");
    assert.notEqual(state.evaluationHashStatus, "ready");
  }
  assert.equal(amended.semanticVersion, previous.semanticVersion + 1);
});
