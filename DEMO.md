# CLAUSUM demo guide

Live frontend: [clausum.vercel.app](https://clausum.vercel.app). The wizard collects independent Party A and Party B interpretations plus each party's structured scope, evidence, deadline, and quantity.

1. Open `/workspace`. Show the fresh agreement ID and the two deterministic differences in evidence and deadline; quantity remains 5 for both parties. The evaluation hash must finish calculating before submission is available.
2. Open `/consensus`. Connect a wallet through Reown and confirm Studio-dev chain `61997`. The app checks the provider's `eth_chainId` before allowing a write.
3. As Party A, create the negotiation and commit Party A's version. Then switch to Party B's registered wallet and commit Party B's version. Each party can commit only once per revision.
4. Evaluate the conflicting revision. The app estimates fees, submits the contract write, waits for finalization, then reads `get_verdict`. A `MATERIAL_CONFLICT` verdict and `BLOCKED` state prevent ratification.
5. Apply the amendment as Party A. The agreement ID remains unchanged, while the prior verdict, transaction, hashes, ratifications, receipt, and commit flags are cleared.
6. Commit both revision-2 versions with aligned obligations, then evaluate again. `EQUIVALENT` with `READY` is required before ratification.
7. Ratify as Party A, then Party B. One approval cannot form the agreement; both must match the exact current canonical hash and the contract must read `FORMED` before the receipt is issued.
8. Open `/receipt`, then `/verify`. A matching query checks the session receipt; **Read contract state** performs a fresh Intelligent Contract readback.

The existing Studio Run & Debug transactions are documented in [README.md](README.md). The current formation flow reads `get_verdict` separately from the contract lifecycle state. If a Studio-dev wallet is unavailable during a presentation, show that recorded evidence and state clearly that no new signed app transaction was run.

Close with: A signature proves approval. CLAUSUM proves shared meaning.
