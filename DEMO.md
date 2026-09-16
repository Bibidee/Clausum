# CLAUSUM demo guide

Live frontend: [clausum.vercel.app](https://clausum.vercel.app). The guided demo starts with a Party B counter-interpretation; it is not an independently submitted external agent message.

1. Open `/workspace`. Show the fresh agreement ID and the two deterministic differences in evidence and deadline; quantity remains 5 for both parties. The evaluation hash must finish calculating before submission is available.
2. Open `/consensus`. Connect a wallet through Reown and confirm Studio-dev chain `61997`. The app checks the provider's `eth_chainId` before allowing a write.
3. Evaluate the conflicting interpretations. The app estimates fees, submits the contract write, waits for finalization, checks successful execution, and reads `get_outcome`. A `MATERIAL_CONFLICT` verdict blocks ratification.
4. Apply the **demo amendment**. Show that the previous verdict, transaction, ratifications, and hashes are invalidated while the fresh input hash is calculated.
5. Evaluate the amended interpretation. When the live verdict is `EQUIVALENT` and deterministic conflicts are zero, continue to `/ratification`.
6. Ratify as Party A, then Party B. One approval cannot form the agreement; both must match the exact current canonical hash.
7. Open `/receipt`. The browser issues a Formation Receipt containing the real finalized transaction, current hashes, deployed contract, and ratification state. These ratifications are browser-local demo approvals, not cryptographic party signatures.
8. Open `/verify`. A matching query confirms **local session receipt consistency**. The page does not perform a fresh GenLayer readback; use its explorer links for network evidence.

The existing Studio Run & Debug transactions and `get_outcome` readbacks are documented in [README.md](README.md). If a Studio-dev wallet is unavailable during a presentation, show that recorded evidence and state clearly that no new signed app transaction was run.

Close with: A signature proves approval. CLAUSUM proves shared meaning.
