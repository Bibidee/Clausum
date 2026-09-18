# CLAUSUM

CLAUSUM is a semantic formation layer for autonomous agreements. It establishes shared meaning between independently reasoning parties before economic commitment.

> A signature proves approval. CLAUSUM proves shared meaning.

## What is built

- Two independently authored Party A / Party B representations, committed by their authorized wallets.
- Deterministic comparison for quantities, evidence, and deadlines.
- A GenLayer Intelligent Contract that submits disputed semantic questions to validator consensus and provides the current contract-authoritative formation state machine.
- Canonical deterministic serialization and SHA-256 hashing.
- Hash-bound two-party ratification and a Formation Receipt.
- Reown injected-wallet flow into the Studio-dev transaction adapter; browser storage is convenience state only.
- A routed Semantic Aurora frontend with dedicated workspace, consensus, ratification, and receipt views.

## Architecture

Negotiation → interpretations → deterministic comparison → GenLayer semantic consensus → resolution → canonical agreement → ratification → Formation Receipt.

Contract mode uses the Intelligent Contract for negotiation creation, per-party version commitments, semantic evaluation, ratification, and formation state. A labelled `demo` mode remains available for offline UI rehearsal only; it is never evidence of onchain formation. The GenLayer adapter estimates fees, sends the wallet-signed write, waits for finalization, and requires a successful GenVM execution result.

## Studio Next integration

The project pins the Studio Next RC JavaScript SDK at `genlayer-js@2.0.0-rc.1` and the CLI at `genlayer@0.40.0-rc.3`. Contract validation uses Python `3.12`, `genlayer-py@0.19.0rc2`, `genlayer-test@0.30.0rc2`, and `genvm-linter@0.11.1rc2` against the cached GenVM `v0.6.0-rc5` artifact.
The `@x402/*` packages are present to satisfy transitive Reown/Coinbase wallet dependency resolution during production builds; CLAUSUM does not expose x402 as an application feature.

- Network: `studio-dev`
- Chain ID: `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- Current submitted contract-authoritative deployment: `0xcEec0403675761E938c16995Df6f835A701D44ec`
- Historical legacy oracle: `0x2a30A638456fc607D306c9617963898CdAae8BC6` (**HISTORICAL**)

### Verified Studio Next evidence

The current submitted Studio-dev deployment was deployed and finalized on Studio Next. Its deployment transaction is
[`0x1baee97d…1a5e5`](https://explorer-studio-dev.genlayer.com/tx/0x1baee97d1bd4d6e15ba2509be58cda8429decd1afea7f5447283f6c90de1a5e5).
The deployed address is [`0xcEec0403675761E938c16995Df6f835A701D44ec`](https://explorer-studio-dev.genlayer.com/address/0xcEec0403675761E938c16995Df6f835A701D44ec).

Fresh signed lifecycle evidence (`AG-LIVE-934844`) is recorded in [artifacts/live-e2e.studio-dev.json](artifacts/live-e2e.studio-dev.json): hard-field conflict finalized as `MATERIAL_CONFLICT`, amendment revision 2 evaluated as `EQUIVALENT`, Party A then Party B ratified independently, and contract readback reached `FORMED` with a `FormationReceiptV1` payload.

Live contract evidence for agreement `clausum-live-conflict-20260915`:

- `MATERIAL_CONFLICT`: derived input hash `a74390e94ae5f34e85339ee5819c6e3fcfea9a867802984440dca05cb0dbf13b`, finalized transaction [`0x4724a730…d1efd`](https://explorer-studio-dev.genlayer.com/tx/0x4724a7302deeefca843cb53c32db185a1315ece0067be30f513301b1aebd1efd); the current formation flow reads `get_verdict` and separately reads the lifecycle state.
- `EQUIVALENT`: derived input hash `4378c403c953c3c8e453e440904596e28b62be6457f7303de51de21ae9393821`, finalized transaction [`0xc8011ec0…15768`](https://explorer-studio-dev.genlayer.com/tx/0xc8011ec0e898de8c7deb26fb8755818cefc0a1676e128b20e7fae37836215768); the current formation flow reads `get_verdict` and separately reads the lifecycle state.

## Formation invariant and current deployment status

The deployed contract provides the authoritative formation state machine. In contract mode, formation is considered valid
only when all of these are true: the latest GenLayer verdict is
`EQUIVALENT`, deterministic conflicts are zero, the verdict input hash matches the active
interpretations, and Party A and Party B have independently ratified the same canonical SHA-256 hash.
Changing interpretations invalidates the previous verdict and both ratifications.

The previous `0xdfDeF3B99df143E2e7a1f762d62671fC4DAd80CD` and `0xc363c709592BA8782eB5472153cAf4CeDEcBC084` addresses are retained only as **HISTORICAL** evidence.
Browser storage is retained only for UI convenience. Contract mode performs negotiation creation, independent
version commits, evaluation, ratification, formation, and receipt reads against the deployed Intelligent Contract.
The labelled `demo` mode remains available only for offline UI rehearsal and is never submission evidence. The app
uses Reown AppKit to select an injected EIP-1193 wallet and exposes that provider to the Studio-dev transaction adapter.

The production frontend is live at [clausum.vercel.app](https://clausum.vercel.app) and tracks the `main` branch.
It preserves the formation provider across routes and renders a contract-backed Formation Receipt only after
matching onchain ratification. The `/verify` page can perform a fresh Intelligent Contract readback and clearly
separates that evidence from local receipt matching. Transaction and contract explorer links provide network
evidence. Reown AppKit's wallet selection modal has been verified in production; a signed transaction through the
production app has not been independently verified because no connected wallet session was available.

The domain suite passes **32/32** tests. It covers canonicalization, conflict and formation rules, receipt
consistency, hash readiness and stale-result protection, Studio-dev wallet chain gating, cryptographically
generated agreement IDs across fresh/reset/new-draft flows, amendment identity preservation, duplicate-name
Party A/B ratification, and the structured procurement demo's quantity and two initial conflicts.

Do not substitute stable Studionet 61999. Studio-dev is resettable and is intended for RC validation.

## Local setup

```bash
pnpm install
pnpm run dev
pnpm run test:domain
pnpm run test:contract
```

To validate the deployed contract toolchain:

```bash
pnpm run genlayer:network
pnpm run genlayer:lint
pnpm run genlayer:deploy
```

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CLAUSUM_MODE` | Local demo | Use `demo` for repeatable local scenarios. |
| `NEXT_PUBLIC_GENLAYER_RPC_URL` | Optional | Studio-dev RPC override. |
| `NEXT_PUBLIC_GENLAYER_CHAIN_ID` | Optional | Must be `61997` for Studio-dev. |
| `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS` | Required for live writes | Address produced by a verified Studio-dev deployment. |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Recommended | Reown AppKit project ID used for WalletConnect-compatible wallet selection; the supplied public demo ID is a source fallback. |

Never place private keys, seed phrases, or wallet secrets in any environment file.

## Demo flow

1. Show the shared natural-language agreement.
2. Compare the guided demo interpretations and surface deterministic conflicts.
3. Connect Party A's Studio-dev wallet, create the negotiation, and commit Party A's version.
4. Connect Party B's registered wallet and commit Party B's version.
5. Evaluate the current revision. A disagreement yields `MATERIAL_CONFLICT` / `BLOCKED`.
6. Amend the same agreement, commit both revision-2 versions, then evaluate again.
7. Once the verdict is `EQUIVALENT` / `READY`, ratify as Party A and then Party B to form the agreement.
8. View the Formation Receipt and use `/verify` for a local receipt match plus fresh contract readback.

See [DEMO.md](DEMO.md) for the judge-facing script.

## Hackathon pitch

**One-line pitch:** CLAUSUM proves two autonomous parties mean the same thing before they commit value.

**Live demo:** [clausum.vercel.app](https://clausum.vercel.app)

**Problem:** matching text and signatures do not guarantee matching obligations when agents reason independently.

**Solution:** CLAUSUM compares structured interpretations, routes semantic questions to GenLayer, and only permits formation after both parties ratify one canonical hash.

**Why GenLayer:** deterministic software handles objective mismatches; GenLayer’s validator consensus handles the judgment required for semantic equivalence.

**Startup opportunity:** formation receipts can be consumed by agent marketplaces, escrow, procurement, payment, and service-assurance systems.

## Roadmap

### Built for the hackathon

- Working formation workspace and guided demo.
- Canonicalization, conflict modeling, ratification rules, and automated domain tests.
- Studio-dev RC configuration, contract source, and wallet/fee lifecycle adapter.

### Production roadmap

- Migrate to a future production network only after GenLayer officially supports that network for this protocol.
- Transaction Kit-powered wallet UX and a genuine Studio-dev `gltest` fee profile for the measured `create_negotiation` path (`artifacts/fee-profile.json`).
- Durable agreement storage, policy governance, receipts API, webhook events, SDK, and downstream protocol integrations.
- Independent security review, privacy controls, and formalized legal-operational boundaries.
