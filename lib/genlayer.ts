import { createClient, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import type { SemanticOutcome } from "./formation";

export const studioDevConfig = {
  chainId: 61997,
  rpc: "https://studio-dev.genlayer.com/api",
} as const;

// Public Studio-dev address. Environment configuration can override this after an upgrade.
export const deployedSemanticConsensusAddress = "0xB235f4e22f6b3B3772a6C4711B14C2ee7EcF9504" as const;

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

export interface ConsensusSubmission {
  agreementId: string;
  buyerInterpretation: string;
  sellerInterpretation: string;
  question: string;
}

export interface ConsensusReceipt {
  transactionHash: `0x${string}`;
  outcome: SemanticOutcome;
  finalized: boolean;
  executionSucceeded: boolean;
}

function isSemanticOutcome(value: unknown): value is SemanticOutcome {
  return value === "EQUIVALENT" || value === "MATERIAL_CONFLICT" || value === "UNRESOLVED";
}

export async function connectStudioDev(provider: Eip1193Provider) {
  const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  const client = createClient({ chain: studioDevnet, account: accounts[0] as `0x${string}`, provider });
  await client.connect("studio-dev");
  return { client, account: accounts[0] as `0x${string}` };
}

export async function submitConsensus(
  provider: Eip1193Provider,
  contractAddress: `0x${string}`,
  input: ConsensusSubmission,
): Promise<ConsensusReceipt> {
  const { client } = await connectStudioDev(provider);
  const write = { address: contractAddress, functionName: "evaluate", args: [input.agreementId, input.buyerInterpretation, input.sellerInterpretation, input.question] };
  const estimate = await client.estimateTransactionFeesForWrite(write);
  const transactionHash = await client.writeContract({ ...write, fees: { distribution: estimate.distribution, feeValue: estimate.feeValue } }) as `0x${string}`;
  const receipt = await client.waitForFinalization({ hash: transactionHash });
  if (!isSuccessful(receipt)) throw new Error(`GenLayer write failed: ${receipt.statusName} / ${receipt.txExecutionResultName}`);
  const outcome = await client.readContract({
    address: contractAddress,
    functionName: "get_outcome",
    args: [input.agreementId],
  });
  if (!isSemanticOutcome(outcome)) throw new Error("GenLayer returned an invalid semantic outcome");
  return { transactionHash, outcome, finalized: true, executionSucceeded: true };
}
