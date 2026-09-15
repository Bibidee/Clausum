# CLAUSUM submission readiness

CLAUSUM is a semantic formation layer for autonomous agreements. GenLayer is necessary because
deterministic comparison cannot decide whether independently expressed obligations are materially
equivalent.

## What is real today

- Canonical serialization and SHA-256 hashes are generated in the browser.
- Formation is gated by the GenLayer outcome, deterministic comparison, current evaluation input
  hash, and matching hash-bound demo ratifications.
- The hardened contract is deployed on Studio Next Studio-dev at `0xdfDeF3B99df143E2e7a1f762d62671fC4DAd80CD` (chain `61997`).
- Deployment transaction: `0x9e36a68d6665a8bc7ea57299a69c60b252e98b9f171a471cc932911c0ead0051` (finalized).
- Live `MATERIAL_CONFLICT` readback passed for input `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` via finalized transaction `0x4d9eead5a319fc2fb39e0b5795a7fb6f03fafa675f9a7335c29c454b4544668a`.
- Live `EQUIVALENT` readback passed for input `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`; Studio Next showed finalized transaction `0xee51c99ca2aaa1c5552504df2968787f3d8cbfa8188118ad6c6aeb6840e1f12` (not yet indexed by the explorer).

## What must be refreshed after this source change

The hardened `contracts/semantic_consensus.py` uses per-evaluation `TreeMap` storage and a new ABI
(`agreement_id`, `input_hash`, Party A, Party B, question). Fresh deployment and both live semantic
readbacks are complete. Full app wallet E2E and two independent browser-local ratifications remain.

## Hackathon limitations

Ratification is a browser-local demo interaction, not a cryptographic signature. Receipts are local
to the active browser session. These boundaries are deliberately visible in the product and README.
