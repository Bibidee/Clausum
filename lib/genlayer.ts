import { createClient, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import type { SemanticOutcome } from "./formation";

export const studioDevConfig = {
  chainId: 61997,
  rpc: "https://studio-dev.genlayer.com/api",
} as const;

export const STUDIO_DEV_CHAIN_ID_HEX = "0xf22d";

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

export function parseChainId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().toLowerCase();
  if (!(/^(0x[0-9a-f]+|[0-9]+)$/.test(normalized))) return null;
  const parsed = normalized.startsWith("0x") ? Number.parseInt(normalized, 16) : Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function readProviderChainId(provider: Eip1193Provider): Promise<number> {
  const raw = await provider.request({ method: "eth_chainId" });
  if (typeof raw !== "string" || !/^0x[0-9a-fA-F]+$/.test(raw)) throw new Error("Wallet returned an invalid chain ID.");
  const chainId = parseChainId(raw);
  if (chainId === null) throw new Error("Wallet returned an invalid chain ID.");
  return chainId;
}

export function isStudioDevChain(chainId: number | null): boolean {
  return chainId === studioDevConfig.chainId;
}

export interface ConsensusSubmission {
  agreementId: string;
  inputHash: string;
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
  const account = accounts?.[0];
  if (!account) throw new Error("No wallet account was returned by the connected wallet.");
  const chainId = await readProviderChainId(provider);
  if (!isStudioDevChain(chainId)) {
    throw new Error(`Wrong wallet network (${chainId}). Switch to GenLayer Studio-dev (chain ${studioDevConfig.chainId}).`);
  }
  const client = createClient({ chain: studioDevnet, account: account as `0x${string}`, provider });
  await client.connect();
  return { client, account: account as `0x${string}`, chainId };
}

export async function submitConsensus(
  provider: Eip1193Provider,
  contractAddress: `0x${string}`,
  input: ConsensusSubmission,
): Promise<ConsensusReceipt> {
  const { client } = await connectStudioDev(provider);
  const write = { address: contractAddress, functionName: "evaluate", args: [input.agreementId, input.inputHash, input.buyerInterpretation, input.sellerInterpretation, input.question] };
  const estimate = await client.estimateTransactionFeesForWrite(write);
  const transactionHash = await client.writeContract({ ...write, fees: { distribution: estimate.distribution, feeValue: estimate.feeValue } }) as `0x${string}`;
  const receipt = await client.waitForFinalization({
    hash: transactionHash as `0x${string}` & { length: 66 },
  });
  if (!isSuccessful(receipt)) throw new Error(`GenLayer write failed: ${receipt.statusName} / ${receipt.txExecutionResultName}`);
  const outcome = await client.readContract({
    address: contractAddress,
    functionName: "get_outcome",
    args: [input.agreementId, input.inputHash],
  });
  if (!isSemanticOutcome(outcome)) throw new Error("GenLayer returned an invalid semantic outcome");
  return { transactionHash, outcome, finalized: true, executionSucceeded: true };
}
