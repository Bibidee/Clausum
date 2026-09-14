# CLAUSUM submission readiness

CLAUSUM is a semantic formation layer for autonomous agreements. GenLayer is necessary because
deterministic comparison cannot decide whether independently expressed obligations are materially
equivalent.

## What is real today

- Canonical serialization and SHA-256 hashes are generated in the browser.
- Formation is gated by the GenLayer outcome, deterministic comparison, current evaluation input
  hash, and matching hash-bound demo ratifications.
- The historical Studio-dev v2 contract evidence is documented in `README.md`.

## What must be refreshed after this source change

The hardened `contracts/semantic_consensus.py` uses per-evaluation `TreeMap` storage and a new ABI
(`agreement_id`, `input_hash`, Party A, Party B, question). It requires a fresh Studio-dev deployment
and live evidence before a final READY claim.

## Hackathon limitations

Ratification is a browser-local demo interaction, not a cryptographic signature. Receipts are local
to the active browser session. These boundaries are deliberately visible in the product and README.
