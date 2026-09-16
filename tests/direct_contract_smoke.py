"""Pinned gltest direct smoke harness.

The Windows prerelease loader leaves fd 0 open while unlinking its temp file;
the process-local wrapper below defers that cleanup without changing gltest.
"""
import os
import sys

sys.path.insert(0, r"C:\Users\ojiku\.cache\genvm-linter\extracted\genlayerlabs-genvm-manager-v0.6.0-rc5\py-lib-genlayer-std\kzr02ndm9et4qkmbqpq5djjt5sme2yt76n7sz1qbzax0knt6mam0")

_unlink = os.unlink


def _safe_unlink(path):
    try:
        _unlink(path)
    except PermissionError:
        pass


os.unlink = _safe_unlink

import hashlib  # noqa: E402

from genlayer.types import Address  # noqa: E402
from gltest.direct import VMContext, create_address, deploy_contract  # noqa: E402
from gltest.direct import wasi_mock  # noqa: E402
import genlayer._internal.on_chain.gl_call as gl_call  # noqa: E402
import genlayer.eq_principle as eq_principle  # noqa: E402
import genlayer as gl  # noqa: E402


vm = VMContext()
party_a = create_address("party-a")
party_b = create_address("party-b")


def version_hash(agreement_id, revision, party, terms, scope, evidence, deadline, quantity):
    payload = "VersionCommitmentV1|"
    for value in [agreement_id, revision, party, scope, evidence, deadline, quantity, terms, "0.1"]:
        payload += str(len(value.encode("utf-8"))) + ":" + value
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


with vm.activate():
    contract = deploy_contract("contracts/semantic_consensus.py", vm, sdk_version="v0.6.0-rc5")
    vm.sender = party_a
    gl_call._imp_raw = wasi_mock.gl_call
    eq_principle.prompt_non_comparative = lambda *args, **kwargs: "EQUIVALENT"
    gl.eq_principle.prompt_non_comparative = lambda *args, **kwargs: "EQUIVALENT"
    agreement_id = "AG-DIRECT-001"
    print("DEPLOYED", type(contract).__name__)
    print("PARTIES", party_a.as_hex, party_b.as_hex)
    print("CREATE", contract.create_negotiation(agreement_id, Address(party_b), "0.1"))
    with vm.expect_revert("negotiation already exists"):
        contract.create_negotiation(agreement_id, Address(party_b), "0.1")
    unrelated = create_address("unrelated")
    with vm.prank(unrelated):
        with vm.expect_revert("caller is not the authorized party"):
            contract.submit_version(agreement_id, "1", "a", "0" * 64, "forbidden", "scope", "evidence", "deadline", "5")
    conflict_id = "AG-DIRECT-CONFLICT"
    contract.create_negotiation(conflict_id, Address(party_b), "0.1")
    assert contract.get_formation_state(conflict_id) == "DRAFT"
    conflict_a = dict(scope="eu providers", evidence="two public sources", deadline="2030-01-01T17:00Z", quantity="5")
    conflict_b = dict(scope="eu providers", evidence="one public source", deadline="2030-01-01T17:00Z", quantity="5")
    ca = version_hash(conflict_id, "1", "a", "critical fixes", **conflict_a)
    cb = version_hash(conflict_id, "1", "b", "critical fixes", **conflict_b)
    contract.submit_version(conflict_id, "1", "a", ca, "critical fixes", **conflict_a)
    with vm.prank(party_b):
        contract.submit_version(conflict_id, "1", "b", cb, "critical fixes", **conflict_b)
    assert contract.evaluate_negotiation(conflict_id, "1") == "MATERIAL_CONFLICT"
    assert contract.get_formation_state(conflict_id) == "BLOCKED"
    print("CONFLICT", contract.get_formation_state(conflict_id))
    assert contract.revise_negotiation(conflict_id) == "2"
    assert contract.get_formation_state(conflict_id) == "DRAFT"
    with vm.expect_revert("both party versions are required"):
        contract.evaluate_negotiation(conflict_id, "2")
    terms_a = "Fix critical vulnerabilities before payment."
    terms_b = "Resolve critical vulnerabilities before payment."
    common = dict(scope="eu providers", evidence="two public sources", deadline="2030-01-01T17:00Z", quantity="5")
    commitment_a = version_hash(agreement_id, "1", "a", terms_a, **common)
    commitment_b = version_hash(agreement_id, "1", "b", terms_b, **common)
    print("SUBMIT_A", contract.submit_version(agreement_id, "1", "a", commitment_a, terms_a, **common))
    with vm.prank(party_b):
        print("SUBMIT_B", contract.submit_version(agreement_id, "1", "b", commitment_b, terms_b, **common))
    vm.mock_llm(".*", "EQUIVALENT")
    print("EVALUATE", contract.evaluate_negotiation(agreement_id, "1"))
    print("STATE", contract.get_formation_state(agreement_id))
    canonical = contract.get_canonical_hash(agreement_id)
    print("CANONICAL", canonical)
    print("RATIFY_A", contract.ratify(agreement_id, canonical))
    with vm.prank(party_b):
        print("RATIFY_B", contract.ratify(agreement_id, canonical))
    assert contract.get_formation_state(agreement_id) == "FORMED"
    print("FORMED", contract.get_formation_state(agreement_id))
    assert contract.get_verdict(agreement_id) == "EQUIVALENT"
    assert contract.get_formation_receipt(agreement_id).startswith("FormationReceiptV1|")
    print("RECEIPT", contract.get_formation_receipt(agreement_id))
