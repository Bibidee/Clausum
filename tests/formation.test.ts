import test from "node:test";
import assert from "node:assert/strict";
import { canForm, canonicalHash, deterministicConflicts, stableStringify } from "../lib/formation";

const base = { scope: "EU providers by revenue", evidence: "two sources", deadline: "Friday 17:00 CET", quantity: 5 };
test("canonicalization makes equivalent objects hash equally", async () => {
  const first = { parties: ["A", "B"], obligations: base, policyVersion: "0.1" } as const;
  const second = { policyVersion: "0.1", obligations: { quantity: 5, deadline: "Friday 17:00 CET", evidence: "two sources", scope: "EU providers by revenue" }, parties: ["A", "B"] } as const;
  assert.equal(stableStringify(first), stableStringify(second));
  assert.equal(await canonicalHash(first), await canonicalHash(second));
});
test("deterministic comparator detects deadline, quantity, and evidence mismatches", () => {
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
