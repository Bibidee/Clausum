# CLAUSUM

CLAUSUM is a semantic formation layer for autonomous agreements. It establishes shared meaning between independently reasoning parties before economic commitment.

> A signature proves approval. CLAUSUM proves shared meaning.

## What is built

- Independent structured interpretations for two parties.
- Deterministic comparison for quantities, evidence, and deadlines.
- A GenLayer Intelligent Contract that submits disputed semantic questions to validator consensus.
- Canonical deterministic serialization and SHA-256 hashing.
- Hash-bound two-party ratification and a Formation Receipt.
- Browser-local demo persistence and a Studio-dev wallet integration seam.

## Architecture

Negotiation → interpretations → deterministic comparison → GenLayer semantic consensus → resolution → canonical agreement → ratification → Formation Receipt.

The browser never declares an agreement formed by itself. Formation is derived from successful comparison and matching canonical hashes. The GenLayer adapter estimates fees, sends the wallet-signed write, waits for finalization, and requires a successful GenVM execution result.

## Studio Next integration

The project pins the Studio Next RC JavaScript SDK at `genlayer-js@2.0.0-rc.1` and the CLI at `genlayer@0.40.0-rc.3`.

- Network: `studio-dev`
- Chain ID: `61997`
- RPC: `https://studio-dev.genlayer.com/api`
- Active contract: `0xdfDeF3B99df143E2e7a1f762d62671fC4DAd80CD`
- Active source: [contracts/semantic_consensus.py](contracts/semantic_consensus.py)

### Verified Studio Next evidence

The hardened instance was deployed and finalized on Studio Next (Studio-dev). Its deployment transaction is
[`0x9e36a68d…ead0051`](https://explorer-studio-next.genlayer.com/tx/0x9e36a68d6665a8bc7ea57299a69c60b252e98b9f171a471cc932911c0ead0051).
The deployed address is `0xdfDeF3B99df143E2e7a1f762d62671fC4DAd80CD`.

Live contract evidence for agreement `clausum-live-conflict-20260915`:

- `MATERIAL_CONFLICT`: input hash `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, finalized transaction [`0x4d9eead5…4544668a`](https://explorer-studio-next.genlayer.com/tx/0x4d9eead5a319fc2fb39e0b5795a7fb6f03fafa675f9a7335c29c454b4544668a); `get_outcome` read returned `MATERIAL_CONFLICT`.
- `EQUIVALENT`: input hash `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`, Studio Next Run & Debug showed finalized transaction `0xee51c99ca2aaa1c5552504df2968787f3d8cbfa8188118ad6c6aeb6840e1f12`; `get_outcome` read returned `EQUIVALENT`. The explorer did not index this hash when checked.

## Formation invariant and current deployment status

Formation is calculated only when all of these are true: the latest GenLayer verdict is
`EQUIVALENT`, deterministic conflicts are zero, the verdict input hash matches the active
interpretations, and Party A and Party B have demo-ratified the same canonical SHA-256 hash.
Changing interpretations invalidates the previous verdict and both ratifications.

The historical address `0xc363c709592BA8782eB5472153cAf4CeDEcBC084` is retained only as historical evidence.
Browser-local persistence and demo ratification are explicitly hackathon-only; wallet signatures and durable
receipt storage remain post-hackathon work. The local app’s browser wallet seam requires an injected provider;
Studio Next’s wallet is origin-scoped, so localhost wallet E2E remains a verification follow-up.

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

Never place private keys, seed phrases, or wallet secrets in any environment file.

## Demo flow

1. Show the shared natural-language agreement.
2. Compare independent meanings and surface deterministic conflicts.
3. Submit the semantic question through the Studio-dev path, or clearly show the local demo fallback.
4. Resolve the conflicting obligations and re-analyze.
5. Compile one canonical Agreement Object.
6. Ratify it as both parties and verify the Formation Receipt.

See [DEMO.md](DEMO.md) for the judge-facing script.

## Hackathon pitch

**One-line pitch:** CLAUSUM proves two autonomous parties mean the same thing before they commit value.

**Live demo:** [clausum-formation.ojikutusarat.chatgpt.site](https://clausum-formation.ojikutusarat.chatgpt.site)

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
