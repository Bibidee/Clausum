# CLAUSUM submission readiness

CLAUSUM is a semantic formation layer for autonomous agreements. GenLayer is necessary because
deterministic comparison cannot decide whether two interpretations establish materially equivalent obligations.

## What is real today

- Canonical serialization and SHA-256 hashes are generated in the browser.
- Formation is gated by the GenLayer outcome, deterministic comparison, current evaluation input
  hash, and matching hash-bound demo ratifications.
- The contract-authoritative state-machine is deployed on Studio Next Studio-dev at `0xcEec0403675761E938c16995Df6f835A701D44ec` (chain `61997`). The prior `0x2a30A638456fc607D306c9617963898CdAae8BC6` remains **HISTORICAL**.
- Deployment transaction: [`0xd2570734…f03df`](https://explorer-studio-dev.genlayer.com/tx/0xd2570734474affa04ecfa2cafe16b3c1f00a9f19139efd84a37ab27f273f03df) (finalized).
- Live `MATERIAL_CONFLICT` readback passed for derived input `a74390e94ae5f34e85339ee5819c6e3fcfea9a867802984440dca05cb0dbf13b` via finalized transaction [`0x4724a730…d1efd`](https://explorer-studio-dev.genlayer.com/tx/0x4724a7302deeefca843cb53c32db185a1315ece0067be30f513301b1aebd1efd).
- Live `EQUIVALENT` readback passed for derived input `4378c403c953c3c8e453e440904596e28b62be6457f7303de51de21ae9393821` via finalized transaction [`0xc8011ec0…15768`](https://explorer-studio-dev.genlayer.com/tx/0xc8011ec0e898de8c7deb26fb8755818cefc0a1676e128b20e7fae37836215768).
- Vercel Production is connected to `Bibidee/Clausum`, tracks `main`, and serves the Semantic Aurora
  multi-page frontend at `https://clausum.vercel.app`.
- Production configuration includes the fresh contract address, Studio-dev RPC (`https://studio-dev.genlayer.com/api`),
  chain `61997`, and `NEXT_PUBLIC_CLAUSUM_MODE=demo`.
- Fresh deployment transaction: [`0x1baee97d…1a5e5`](https://explorer-studio-dev.genlayer.com/tx/0x1baee97d1bd4d6e15ba2509be58cda8429decd1afea7f5447283f6c90de1a5e5). Earlier live lifecycle transactions are recorded in `artifacts/live-e2e.studio-dev.json`; the final instance still requires a clean lifecycle run after the Studio validator queue clears.

## Final verification snapshot

The deployed legacy contract uses per-evaluation `TreeMap` storage and the existing ABI
(`agreement_id`, `input_hash`, Party A, Party B, question). The current source additionally contains
the candidate state-machine ABI; it requires a fresh deployment and frontend migration before it can
replace the active address.

## Hackathon limitations

Ratification is a browser-local demo interaction, not a cryptographic signature. Receipts are local
to the active browser session. These boundaries are deliberately visible in the product and README.

- Submission readiness: reviewable with a disclosed wallet signing limitation. Production tracks `main`; consult the deployment record for its current commit.
- Contract SHA-256 (deployed source): `A964998CAB38BB656013A7145BA0ECAD252721934E9E80D35891E602D10AEE8F`
- Validation environment: Python `3.12.10`, `genlayer-py` `0.19.0rc2`, `genlayer-test` `0.30.0rc2`, `genvm-linter` `0.11.1rc2`, GenVM artifact `v0.6.0-rc5`.
- Domain tests: PASS (25/25). Coverage includes unique fresh/reset/new-draft agreement IDs, amendment ID preservation, duplicate-name independent ratification, procurement quantity 5 with only evidence/deadline conflicts, stale evidence and async-result protection, hash readiness, wallet chain gating, and receipt consistency.
- TypeScript: PASS
- Lint: PASS
- Frontend build: PASS
- GenLayer check/validate/typecheck: PASS (zero diagnostics; cached GenVM artifact `v0.6.0-rc5`)
- Direct GenVM state-machine smoke: PASS (contract deployment, duplicate-ID rejection, unauthorized submission rejection, hard-field `MATERIAL_CONFLICT`, revision reset, semantic `UNRESOLVED`, `EQUIVALENT`, independent Party A/B ratification, `FORMED`, receipt readback, and formed-state replay rejection). Fresh live Studio-dev lifecycle evidence is recorded in `artifacts/live-e2e.studio-dev.json`.
- Fee profile: NOT GENERATED. The prior zero-valued file was a placeholder and has been removed; a genuine `gltest` measurement is required after final deployment.
- Reown modal and supported wallet options: verified on the production origin.
- EIP-1193 provider bridge into the GenLayer adapter: implemented; the provider's `eth_chainId` is checked against Studio-dev `61997` before a write.
- Connected account, disconnect/reconnect, network switching, and a signed app transaction: **not verified** because no wallet session/provider was available in the browser environment.
- Studio Run & Debug deployment, live writes, finalization, and `get_outcome` readbacks: verified with the transactions above.
- Browser receipt: issued from current finalized transaction, canonical hash, evaluation hash, and both local ratifications. It is not a cryptographic signature. `/verify` checks local session consistency, not a fresh on-chain read.

Historical addresses `0xdfDeF3B99df143E2e7a1f762d62671fC4DAd80CD` and `0xc363c709592BA8782eB5472153cAf4CeDEcBC084` remain labelled **HISTORICAL**.
