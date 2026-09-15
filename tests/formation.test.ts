import test from "node:test";
import assert from "node:assert/strict";
import { canForm, canonicalHash, createFormationReceipt, deterministicConflicts, evaluationHashPayload, evaluationInputHash, isEvaluationHashBound, stableStringify } from "../lib/formation";

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
