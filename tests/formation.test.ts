import test from "node:test";
import assert from "node:assert/strict";
import { canEvaluateCurrentInput, canForm, canonicalHash, createFormationReceipt, deterministicConflicts, evaluationHashPayload, evaluationInputHash, isEvaluationFinalized, isEvaluationHashBound, isEvaluationRequestCurrent, isFormationReceiptConsistent, stableStringify, versionCommitmentHash, versionCommitmentPayload } from "../lib/formation";
import { amendFormationState, clearRuntime, configureDraftState, createAgreementId, initialState, ratifyFormationState, resetFormationState } from "../lib/formation-context";
import { demoScenarios, deriveConservativeObligations } from "../lib/demo-scenarios";
import { connectStudioDev, isStudioDevChain, parseChainId, parseFormationContractReceipt, readProviderChainId, STUDIO_DEV_CHAIN_ID_HEX, switchToStudioDev } from "../lib/genlayer";

const base = { scope: "EU providers by revenue", evidence: "two sources", deadline: "Friday 17:00 CET", quantity: 5 };
test("network helper verifies an already-correct chain", async () => {
  const calls: string[] = [];
  const provider = { request: async ({ method }: { method: string }) => { calls.push(method); return "0xf22d"; } };
  assert.equal(await switchToStudioDev(provider), 61997);
  assert.deepEqual(calls, ["wallet_switchEthereumChain", "eth_chainId"]);
});
test("network helper adds an unknown Studio-dev chain then rechecks it", async () => {
  const calls: string[] = [];
  const provider = { request: async ({ method }: { method: string }) => { calls.push(method); if (method === "wallet_switchEthereumChain" && calls.length === 1) throw { code: 4902 }; return method === "eth_chainId" ? "0xf22d" : null; } };
  assert.equal(await switchToStudioDev(provider), 61997);
  assert.deepEqual(calls, ["wallet_switchEthereumChain", "wallet_addEthereumChain", "wallet_switchEthereumChain", "eth_chainId"]);
});
test("network helper rejects a switch that leaves the wallet on the wrong chain", async () => {
  const provider = { request: async ({ method }: { method: string }) => method === "eth_chainId" ? "0x1234" : null };
  await assert.rejects(() => switchToStudioDev(provider), /still on chain/);
});
test("network helper surfaces a user-rejected switch", async () => {
  const provider = { request: async () => { throw { code: 4001 }; } };
  await assert.rejects(() => switchToStudioDev(provider), /cancelled/);
});
test("network helper surfaces a rejected add-chain request", async () => {
  let first = true;
  const provider = { request: async ({ method }: { method: string }) => { if (method === "wallet_switchEthereumChain" && first) { first = false; throw { code: 4902 }; } throw { code: 4001 }; } };
  await assert.rejects(() => switchToStudioDev(provider), /cancelled/);
});
test("wallet adapter uses the provider's current account after switching", async () => {
  const current = "0xCa360741DC1AdB32BAeB1d338730098c6EDd2a54";
  const calls: string[] = [];
  const provider = { request: async ({ method }: { method: string }) => { calls.push(method); return method === "eth_accounts" ? [current] : "0xf22d"; } };
  const result = await connectStudioDev(provider, "0xFb67de8f364B97cFDFef45AdAfA6A7739aE572F2");
  assert.equal(result.account, current);
  assert.deepEqual(calls, ["eth_accounts", "eth_chainId"]);
});
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

test("version commitments bind party, revision, hard fields, semantic terms, and policy", async () => {
  const value = { agreementId: "AG-DIRECT-001", revision: "1", party: "a" as const, semanticTerms: "Fix critical vulnerabilities before payment.", scope: "eu providers", evidence: "two public sources", deadline: "2030-01-01T17:00Z", quantity: "5", policyVersion: "0.1" };
  assert.equal(versionCommitmentPayload(value), "VersionCommitmentV1|13:AG-DIRECT-0011:11:a12:eu providers18:two public sources17:2030-01-01T17:00Z1:544:Fix critical vulnerabilities before payment.3:0.1");
  assert.equal(await versionCommitmentHash(value), "35306bb99a540642f50257dca0c0dc2ab5e36986cb79b2dd1b00e566b9c4b8da");
  assert.notEqual(await versionCommitmentHash({ ...value, party: "b" }), await versionCommitmentHash(value));
  assert.notEqual(await versionCommitmentHash({ ...value, semanticTerms: "changed" }), await versionCommitmentHash(value));
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

test("contract FormationReceiptV1 parser validates length-prefixed evidence", () => {
  const values = ["AG-1", "1", "a".repeat(64), "b".repeat(64), "EQUIVALENT", "a".repeat(64), "a".repeat(64), "0.1"];
  const raw = "FormationReceiptV1|" + values.map(value => `${value.length}:${value}`).join("");
  assert.deepEqual(parseFormationContractReceipt(raw), {
    agreementId: "AG-1",
    revision: "1",
    canonicalAgreementHash: "a".repeat(64),
    evaluationInputHash: "b".repeat(64),
    verdict: "EQUIVALENT",
    partyARatifiedHash: "a".repeat(64),
    partyBRatifiedHash: "a".repeat(64),
    policyVersion: "0.1",
  });
  assert.equal(parseFormationContractReceipt(`${raw}tampered`), null);
  assert.equal(parseFormationContractReceipt("NOT_FORMED"), null);
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
  const fresh = initialState();
  const previous = { ...fresh, outcome: "EQUIVALENT" as const, status: "finalized" as const, canonicalHash: "old-canonical", evaluationHash: "old-input", canonicalHashStatus: "ready" as const, evaluationHashStatus: "ready" as const, verdictHash: "old-input", tx: "0xtx", ratifications: { a: "old-canonical", b: "old-canonical" }, authoritativeRead: { state: "FORMED", verdict: "EQUIVALENT", canonicalHash: "old-canonical", partyARatifiedHash: "old-canonical", partyBRatifiedHash: "old-canonical", partyAAddress: "0xa", partyBAddress: "0xb", receipt: "FormationReceiptV1|", readAt: "2026-01-01T00:00:00.000Z" }, receipt: createFormationReceipt({ agreementId: fresh.agreementId, canonicalAgreementHash: "old-canonical", evaluationInputHash: "old-input", verdict: "EQUIVALENT", transactionHash: "0xtx", contractAddress: "0xcontract", network: "Studio-dev", partyARatifiedHash: "old-canonical", partyBRatifiedHash: "old-canonical", policyVersion: "0.1", formedAt: "2026-01-01T00:00:00.000Z" }) };
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
    assert.equal(state.authoritativeRead, null);
    assert.notEqual(state.canonicalHashStatus, "ready");
    assert.notEqual(state.evaluationHashStatus, "ready");
  }
  assert.equal(amended.semanticVersion, previous.semanticVersion + 1);
});

test("fresh agreements and reset receive cryptographically generated distinct IDs", () => {
  const first = initialState();
  const second = initialState();
  const reset = resetFormationState(first);
  assert.match(first.agreementId, /^AG-[0-9A-F-]{36}$/);
  assert.notEqual(first.agreementId, second.agreementId);
  assert.notEqual(reset.agreementId, first.agreementId);
  assert.notEqual(first.agreementId, "AG-DEMO");
  assert.equal(createAgreementId(() => "test-uuid"), "AG-TEST-UUID");
});

test("amendment preserves the agreement ID while new draft creates one", () => {
  const first = initialState();
  const amended = amendFormationState(first);
  assert.equal(amended.agreementId, first.agreementId);
  assert.equal(amended.semanticVersion, first.semanticVersion + 1);
  const draft = configureDraftState(first, { title: "New", partyAName: "A", partyBName: "B", partyBAddress: "", obligations: base });
  assert.notEqual(draft.agreementId, first.agreementId);
  assert.equal(draft.semanticVersion, first.semanticVersion + 1);
});

test("duplicate display names still ratify independent party slots", () => {
  const ready = { ...initialState(), partyAName: "Agent", partyBName: "Agent", outcome: "EQUIVALENT" as const, status: "finalized" as const, canonicalHash: "canonical", evaluationHash: "evaluation", canonicalHashStatus: "ready" as const, evaluationHashStatus: "ready" as const, verdictHash: "evaluation", tx: "0xtx" };
  const onlyA = ratifyFormationState(ready, "a", [], "0xcontract", "0.1");
  assert.deepEqual(onlyA.ratifications, { a: "canonical", b: "" });
  assert.equal(onlyA.receipt, null);
  assert.equal(canForm(onlyA.outcome, [], onlyA.ratifications.a, onlyA.ratifications.b, onlyA.evaluationHash, onlyA.verdictHash), false);
  const both = ratifyFormationState(onlyA, "b", [], "0xcontract", "0.1");
  assert.deepEqual(both.ratifications, { a: "canonical", b: "canonical" });
  assert.ok(both.receipt);
  assert.equal(canForm(both.outcome, [], both.ratifications.a, both.ratifications.b, both.evaluationHash, both.verdictHash), true);
});

test("structured procurement scenario keeps quantity five and exactly evidence/deadline conflicts", () => {
  const procurement = demoScenarios.find(scenario => scenario.name === "Procurement agreement");
  assert.ok(procurement);
  assert.equal(procurement.obligations.quantity, 5);
  const seller = { ...procurement.obligations, evidence: "one public source", deadline: "Friday 17:00 UTC" };
  assert.deepEqual(deterministicConflicts(procurement.obligations, seller), ["deadline", "evidence"]);
  assert.equal(deriveConservativeObligations(procurement.text).quantity, 1, "time must not be interpreted as quantity");
});
