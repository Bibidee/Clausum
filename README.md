# CLAUSUM

CLAUSUM is a semantic formation layer for autonomous agreements. It establishes shared meaning between independently reasoning parties before economic commitment.

> A signature proves approval. CLAUSUM proves shared meaning.

## What is built

- Guided demo interpretations for two parties; independent external agent input is future work.
- Deterministic comparison for quantities, evidence, and deadlines.
- A GenLayer Intelligent Contract that submits disputed semantic questions to validator consensus.
- Canonical deterministic serialization and SHA-256 hashing.
- Hash-bound two-party ratification and a Formation Receipt.
- Browser-local demo persistence and a Studio-dev wallet integration seam.
- A routed Semantic Aurora frontend with dedicated workspace, consensus, ratification, and receipt views.

## Architecture

Negotiation → interpretations → deterministic comparison → GenLayer semantic consensus → resolution → canonical agreement → ratification → Formation Receipt.

The browser never declares an agreement formed by itself. Formation is derived from successful comparison and matching canonical hashes. The GenLayer adapter estimates fees, sends the wallet-signed write, waits for finalization, and requires a successful GenVM execution result.

## Studio Next integration

The project pins the Studio Next RC JavaScript SDK at `genlayer-js@2.0.0-rc.1` and the CLI at `genlayer@0.40.0-rc.3`.
The `@x402/*` packages are present to satisfy transitive Reown/Coinbase wallet dependency resolution during production builds; CLAUSUM does not expose x402 as an application feature.

- Network: `studio-dev`
- Chain ID: `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- Active contract: `0x2a30A638456fc607D306c9617963898CdAae8BC6`
- Active source: [contracts/semantic_consensus.py](contracts/semantic_consensus.py)

### Verified Studio Next evidence

The final hardened instance was deployed and finalized on Studio Next (Studio-dev). Its deployment transaction is
[`0xd2570734…f03df`](https://explorer-studio-dev.genlayer.com/tx/0xd2570734474affa04ecfa2cafe16b3c1f00a9f19139efd84a37ab27f273f03df).
The deployed address is [`0x2a30A638456fc607D306c9617963898CdAae8BC6`](https://explorer-studio-dev.genlayer.com/address/0x2a30A638456fc607D306c9617963898CdAae8BC6).

Live contract evidence for agreement `clausum-live-conflict-20260915`:

- `MATERIAL_CONFLICT`: derived input hash `a74390e94ae5f34e85339ee5819c6e3fcfea9a867802984440dca05cb0dbf13b`, finalized transaction [`0x4724a730…d1efd`](https://explorer-studio-dev.genlayer.com/tx/0x4724a7302deeefca843cb53c32db185a1315ece0067be30f513301b1aebd1efd); `get_outcome` read returned `MATERIAL_CONFLICT`.
- `EQUIVALENT`: derived input hash `4378c403c953c3c8e453e440904596e28b62be6457f7303de51de21ae9393821`, finalized transaction [`0xc8011ec0…15768`](https://explorer-studio-dev.genlayer.com/tx/0xc8011ec0e898de8c7deb26fb8755818cefc0a1676e128b20e7fae37836215768); `get_outcome` read returned `EQUIVALENT`.

## Formation invariant and current deployment status

Formation is calculated only when all of these are true: the latest GenLayer verdict is
`EQUIVALENT`, deterministic conflicts are zero, the verdict input hash matches the active
interpretations, and Party A and Party B have demo-ratified the same canonical SHA-256 hash.
Changing interpretations invalidates the previous verdict and both ratifications.

The previous `0xdfDeF3B99df143E2e7a1f762d62671fC4DAd80CD` and `0xc363c709592BA8782eB5472153cAf4CeDEcBC084` addresses are retained only as **HISTORICAL** evidence.
Browser-local persistence and demo ratification are explicitly hackathon-only; wallet signatures and durable
receipt storage remain post-hackathon work. The app now uses Reown AppKit for WalletConnect-compatible wallet
selection and exposes the connected EIP-1193 provider to the Studio-dev transaction adapter.

The production frontend is live at [clausum.vercel.app](https://clausum.vercel.app) and tracks the `main` branch.
It preserves the formation provider across routes and renders a browser-session Formation Receipt only after
matching ratification. The `/verify` page checks local receipt consistency; it does not perform a fresh GenLayer
readback. Transaction and contract explorer links provide network evidence. Reown AppKit's wallet selection
modal has been verified in production; a signed wallet transaction still requires a connected wallet session.

Do not substitute stable Studionet 61999. Studio-dev is resettable and is intended for RC validation.

## Local setup

```bash
pnpm install
pnpm run dev
pnpm run test:domain
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
3. Connect a Studio-dev wallet and submit the semantic question through the deployed contract.
4. Resolve the conflicting obligations and re-analyze.
5. Compile one canonical Agreement Object.
6. Ratify it as both parties and verify the Formation Receipt.

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

- Deploy and retain contract evidence on Bradbury after Studio-dev validation.
- Transaction Kit-powered wallet UX and generated fee profiles from `gltest`.
- Durable agreement storage, policy governance, receipts API, webhook events, SDK, and downstream protocol integrations.
- Independent security review, privacy controls, and formalized legal-operational boundaries.
