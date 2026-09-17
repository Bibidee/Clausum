# CLAUSUM submission readiness

CLAUSUM is a semantic formation layer for autonomous agreements. GenLayer is necessary because
deterministic comparison cannot decide whether two interpretations establish materially equivalent obligations.

## What is real today

- Canonical serialization and SHA-256 commitments are generated deterministically and checked by the contract.
- Formation is gated by the GenLayer outcome, authoritative deterministic comparison, current evaluation input
  hash, and matching onchain ratifications from the two authorized party addresses.
- The contract-authoritative state-machine is deployed on Studio Next Studio-dev at `0xcEec0403675761E938c16995Df6f835A701D44ec` (chain `61997`). The prior `0x2a30A638456fc607D306c9617963898CdAae8BC6` remains **HISTORICAL**.
- Deployment transaction: [`0x1baee97d…1a5e5`](https://explorer-studio-dev.genlayer.com/tx/0x1baee97d1bd4d6e15ba2509be58cda8429decd1afea7f5447283f6c90de1a5e5) (finalized).
- Live `MATERIAL_CONFLICT` readback passed for derived input `a74390e94ae5f34e85339ee5819c6e3fcfea9a867802984440dca05cb0dbf13b` via finalized transaction [`0x4724a730…d1efd`](https://explorer-studio-dev.genlayer.com/tx/0x4724a7302deeefca843cb53c32db185a1315ece0067be30f513301b1aebd1efd).
- Live `EQUIVALENT` readback passed for derived input `4378c403c953c3c8e453e440904596e28b62be6457f7303de51de21ae9393821` via finalized transaction [`0xc8011ec0…15768`](https://explorer-studio-dev.genlayer.com/tx/0xc8011ec0e898de8c7deb26fb8755818cefc0a1676e128b20e7fae37836215768).
- Vercel Production is connected to `Bibidee/Clausum`, tracks `main`, and serves the Semantic Aurora
  multi-page frontend at `https://clausum.vercel.app`.
- Production configuration includes the fresh contract address, Studio-dev RPC (`https://studio-dev.genlayer.com/api`),
  chain `61997`, `NEXT_PUBLIC_CLAUSUM_MODE=contract`, and the verified Reown project configuration.
- Contract mode is now implemented in the routed frontend: Party A creates the negotiation and commits its version, Party B commits from the authorized wallet, evaluation calls `evaluate_negotiation`, and ratification calls the contract from the matching party wallet. `demo` remains an explicitly labelled offline rehearsal mode.
- Fresh deployment transaction: [`0x1baee97d…1a5e5`](https://explorer-studio-dev.genlayer.com/tx/0x1baee97d1bd4d6e15ba2509be58cda8429decd1afea7f5447283f6c90de1a5e5). Final live lifecycle `AG-LIVE-934844` is recorded in `artifacts/live-e2e.studio-dev.json`: `MATERIAL_CONFLICT`, amendment `EQUIVALENT`, independent A/B ratification, and `FORMED` receipt readback.

## Final verification snapshot

The fresh deployed contract is the active contract-authoritative state machine. It uses bounded TreeMap storage,
independent party addresses and version commitments, deterministic hard-field gating, revision invalidation,
GenLayer outcomes, onchain ratification, and a contract-readable Formation Receipt.

## Hackathon limitations

The browser still keeps a convenience copy of the receipt for navigation, but formation authority and receipt
eligibility come from the Intelligent Contract. Reown wallet signing remains the required user action for writes.

- Submission readiness: reviewable with a disclosed wallet signing limitation. Production tracks `main`; consult the deployment record for its current commit.
- Contract SHA-256 (deployed source): `06D631EAC02730A17B18A4B2ED88FAF868633DDF46BADB71F2D5D1DECD8705DB`
- Validation environment: Python `3.12.10`, `genlayer-py` `0.19.0rc2`, `genlayer-test` `0.30.0rc2`, `genvm-linter` `0.11.1rc2`, GenVM artifact `v0.6.0-rc5`.
- Domain tests: PASS (26/26). Coverage includes unique fresh/reset/new-draft agreement IDs, amendment ID preservation, duplicate-name independent ratification, procurement quantity 5 with only evidence/deadline conflicts, stale evidence and async-result protection, hash readiness, wallet chain gating, and receipt consistency.
- TypeScript: PASS
- Lint: PASS
- Frontend build: PASS
- GenLayer check/validate/typecheck: PASS (zero diagnostics; cached GenVM artifact `v0.6.0-rc5`)
- Direct GenVM state-machine smoke: PASS (contract deployment, duplicate-ID rejection, unauthorized submission rejection, hard-field `MATERIAL_CONFLICT`, revision reset, semantic `UNRESOLVED`, `EQUIVALENT`, independent Party A/B ratification, `FORMED`, receipt readback, and formed-state replay rejection). Fresh live Studio-dev lifecycle evidence is recorded in `artifacts/live-e2e.studio-dev.json`.
- Fee profile: genuine Studio-dev `gltest` measurement recorded in [`artifacts/fee-profile.json`](artifacts/fee-profile.json) for `create_negotiation` (chain 61997, 15% headroom). The Studio-dev backend does not expose consumed fee accounting for this run, so the profile intentionally records only observed allocation/execution fields; no values are hand-invented.
- Reown modal and supported wallet options: verified on the production origin.
- EIP-1193 provider bridge into the GenLayer adapter: implemented; the provider's `eth_chainId` is checked against Studio-dev `61997` before a write.
- Connected account, disconnect/reconnect, network switching, and a signed app transaction: **not verified** because no wallet session/provider was available in the browser environment.
- Studio Run & Debug deployment, live writes, finalization, and `get_outcome` readbacks: verified with the transactions above.
- Browser receipt: rendered from the current finalized transaction, canonical hash, evaluation hash, and both contract ratifications. `/verify` supports a fresh contract readback and labels local receipt matching separately.

Historical addresses `0xdfDeF3B99df143E2e7a1f762d62671fC4DAd80CD` and `0xc363c709592BA8782eB5472153cAf4CeDEcBC084` remain labelled **HISTORICAL**.
