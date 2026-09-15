# CLAUSUM submission readiness

CLAUSUM is a semantic formation layer for autonomous agreements. GenLayer is necessary because
deterministic comparison cannot decide whether independently expressed obligations are materially
equivalent.

## What is real today

- Canonical serialization and SHA-256 hashes are generated in the browser.
- Formation is gated by the GenLayer outcome, deterministic comparison, current evaluation input
  hash, and matching hash-bound demo ratifications.
- The final hardened contract is deployed on Studio Next Studio-dev at `0x2a30A638456fc607D306c9617963898CdAae8BC6` (chain `61997`).
- Deployment transaction: `0xd2570734474affa04ecfa2cafe16b3c1f00a9f19139efd84a37ab27f273f03df` (finalized).
- Live `MATERIAL_CONFLICT` readback passed for derived input `a74390e94ae5f34e85339ee5819c6e3fcfea9a867802984440dca05cb0dbf13b` via finalized transaction `0x4724a7302deeefca843cb53c32db185a1315ece0067be30f513301b1aebd1efd`.
- Live `EQUIVALENT` readback passed for derived input `4378c403c953c3c8e453e440904596e28b62be6457f7303de51de21ae9393821` via finalized transaction `0xc8011ec0e898de8c7deb26fb8755818cefc0a1676e128b20e7fae37836215768`.
- Vercel Production is connected to `Bibidee/Clausum`, tracks `main`, and serves the Semantic Aurora
  multi-page frontend at `https://clausum.vercel.app` from deployment `JBqhVNdj8iZEPp7eMALae8NVLoKD`
  (commit `a299897`).
- Production configuration includes the fresh contract address, Studio-dev RPC (`https://studio-dev.genlayer.com/api`),
  chain `61997`, and `NEXT_PUBLIC_CLAUSUM_MODE=demo`.

## Final verification snapshot

The hardened `contracts/semantic_consensus.py` uses per-evaluation `TreeMap` storage and a new ABI
(`agreement_id`, `input_hash`, Party A, Party B, question). Fresh deployment and both live semantic
readbacks are complete. The two live Studio transactions finalized successfully and their readbacks match the expected outcomes.

## Hackathon limitations

Ratification is a browser-local demo interaction, not a cryptographic signature. Receipts are local
to the active browser session. These boundaries are deliberately visible in the product and README.

- Final readiness: NOT READY (frontend and live contract evidence are complete; wallet E2E remains blocked by origin-scoped provider injection)
- Frontend reconstruction commit: `a2998973fecf82a1b30e1ff846d12af2ad206f9c`
- Contract SHA-256 (final source): `667B39596F98EBB4FFCB01426F3F5B5F9A1866518BC32E8C2AC43F8857158872`
- Domain tests: PASS (8/8)
- TypeScript: PASS
- Lint: PASS
- Frontend build: PASS
- GenLayer check/validate/typecheck: PASS (zero diagnostics)
- Reset cleanup, receipt stability, hash binding, and independent ratification rules: covered by the domain suite
- Full app wallet lifecycle: NOT YET VERIFIED; the Vercel origin currently exposes no injected `window.ethereum` provider. Studio Run & Debug live writes/readbacks are verified above.

Historical addresses `0xdfDeF3B99df143E2e7a1f762d62671fC4DAd80CD` and `0xc363c709592BA8782eB5472153cAf4CeDEcBC084` remain labelled **HISTORICAL**.
