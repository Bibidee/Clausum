import { createClient, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { versionCommitmentHash, type SemanticOutcome } from "./formation";

export const studioDevConfig = {
  chainId: 61997,
  rpc: "https://studio-dev.genlayer.com/api",
} as const;

export const STUDIO_DEV_CHAIN_ID_HEX = "0xf22d";

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

export async function switchToStudioDev(provider: Eip1193Provider): Promise<number> {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIO_DEV_CHAIN_ID_HEX }] });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined;
    if (code !== 4902) throw new Error("Network switch was cancelled.");
    try {
      await provider.request({ method: "wallet_addEthereumChain", params: [{
        chainId: STUDIO_DEV_CHAIN_ID_HEX,
        chainName: "GenLayer Studio-dev",
        rpcUrls: [studioDevConfig.rpc],
        blockExplorerUrls: ["https://explorer-studio-dev.genlayer.com"],
        nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
      }] });
    } catch (addError) {
      const addCode = typeof addError === "object" && addError !== null && "code" in addError ? (addError as { code?: unknown }).code : undefined;
      if (addCode === 4001) throw new Error("Network switch was cancelled.");
      throw addError;
    }
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIO_DEV_CHAIN_ID_HEX }] });
  }
  const chainId = await readProviderChainId(provider);
  if (!isStudioDevChain(chainId)) throw new Error(`Studio-dev was requested, but the wallet is still on chain ${chainId}.`);
  return chainId;
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

export function isSemanticOutcome(value: unknown): value is SemanticOutcome {
  return value === "EQUIVALENT" || value === "MATERIAL_CONFLICT" || value === "UNRESOLVED";
}

export async function connectStudioDev(provider: Eip1193Provider, knownAccount?: string) {
  // Always read the wallet's current account before a write. Reown/AppKit can
  // restore or switch accounts between route changes; trusting a cached
  // address would make the provider reject an otherwise valid transaction.
  let accounts = await provider.request({ method: "eth_accounts" }) as string[];
  if (!accounts?.length) accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
  const account = accounts?.[0] ?? knownAccount;
  if (!account) throw new Error("No wallet account was returned by the connected wallet.");
  let chainId = await readProviderChainId(provider);
  if (!isStudioDevChain(chainId)) chainId = await switchToStudioDev(provider);
  const client = createClient({ chain: studioDevnet, account: account as `0x${string}`, provider });
  return { client, account: account as `0x${string}`, chainId };
}

export interface FormationWriteReceipt {
  transactionHash: `0x${string}`;
  finalized: boolean;
  executionSucceeded: boolean;
}

export interface FormationContractReceipt {
  agreementId: string;
  revision: string;
  canonicalAgreementHash: string;
  evaluationInputHash: string;
  verdict: string;
  partyARatifiedHash: string;
  partyBRatifiedHash: string;
  policyVersion: string;
}

export function parseFormationContractReceipt(raw: unknown): FormationContractReceipt | null {
  if (typeof raw !== "string" || !raw.startsWith("FormationReceiptV1|")) return null;
  let offset = "FormationReceiptV1|".length;
  const values: string[] = [];
  for (let index = 0; index < 8; index += 1) {
    const separator = raw.indexOf(":", offset);
    if (separator < 0) return null;
    const length = Number.parseInt(raw.slice(offset, separator), 10);
    if (!Number.isSafeInteger(length) || length < 0) return null;
    const start = separator + 1;
    const value = raw.slice(start, start + length);
    if ([...value].length !== length || start + length > raw.length) return null;
    values.push(value);
    offset = start + length;
  }
  if (offset !== raw.length) return null;
  const [agreementId, revision, canonicalAgreementHash, evaluationInputHash, verdict, partyARatifiedHash, partyBRatifiedHash, policyVersion] = values;
  return { agreementId, revision, canonicalAgreementHash, evaluationInputHash, verdict, partyARatifiedHash, partyBRatifiedHash, policyVersion };
}

export interface PartyVersionInput {
  agreementId: string;
  revision: string;
  party: "a" | "b";
  commitment: string;
  semanticTerms: string;
  scope: string;
  evidence: string;
  deadline: string;
  quantity: string;
}

type CalldataArg = string | number | bigint | boolean | null;

type RpcErrorLike = { code?: unknown; message?: unknown; data?: { retry_after_seconds?: unknown }; cause?: unknown };

function walkRpcError(error: unknown): RpcErrorLike[] {
  const seen = new Set<unknown>();
  const entries: RpcErrorLike[] = [];
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    entries.push(current as RpcErrorLike);
    current = (current as RpcErrorLike).cause;
  }
  return entries;
}

function isStudioBusy(error: unknown) {
  return walkRpcError(error).some(entry => entry.code === -32006 || /all 8 execution slots occupied|server busy/i.test(String(entry.message)));
}

function retryDelay(error: unknown) {
  const seconds = walkRpcError(error)
    .map(entry => Number(entry.data?.retry_after_seconds))
    .find(value => Number.isFinite(value) && value > 0);
  return Math.min(Math.max(seconds ?? 2, 1), 8) * 1000;
}

const sleep = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds));

/** Retry safe read, estimation, and lifecycle polls when Studio-dev is busy.
 * Never wrap a signed write: a network-ambiguous write must be retried only
 * after the caller has checked the chain, avoiding accidental duplicates. */
async function retryStudioBusy<T>(operation: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isStudioBusy(error) || index === attempts - 1) break;
      await sleep(retryDelay(error));
    }
  }
  if (isStudioBusy(lastError)) throw new Error("Studio-dev is temporarily busy. No transaction was retried automatically; wait a few seconds, verify the on-chain state, then try again.");
  throw lastError;
}

async function writeAndFinalize(client: Awaited<ReturnType<typeof connectStudioDev>>["client"], contractAddress: `0x${string}`, functionName: string, args: CalldataArg[]): Promise<FormationWriteReceipt> {
  const write = { address: contractAddress, functionName, args };
  const estimate = await retryStudioBusy(() => client.estimateTransactionFeesForWrite(write));
  let transactionHash: `0x${string}`;
  try {
    transactionHash = await client.writeContract({ ...write, fees: { distribution: estimate.distribution, feeValue: estimate.feeValue } }) as `0x${string}`;
  } catch (error) {
    if (isStudioBusy(error)) throw new Error("Studio-dev is temporarily busy before the write could be confirmed. No automatic retry was sent; verify the on-chain state, then try again.");
    throw error;
  }
  const receipt = await waitForStudioFinalization(client, transactionHash);
  if (!isSuccessful(receipt)) throw new Error(`GenLayer write failed: ${receipt.statusName} / ${receipt.txExecutionResultName}`);
  return { transactionHash, finalized: true, executionSucceeded: true };
}

/**
 * Studio-dev currently exposes a completed consensus transaction as stored
 * status `ACCEPTED` (5) even after its protocol lifecycle has reached
 * `FINALIZED`. genlayer-js's strict finalization poll only accepts status 7,
 * so the UI can incorrectly report a timeout for a successful write. Accept
 * the materialized decision as the completion proof, while retaining the
 * SDK's strict poll whenever the endpoint reports FINALIZED normally.
 */
async function waitForStudioFinalization(
  client: Awaited<ReturnType<typeof connectStudioDev>>["client"],
  transactionHash: `0x${string}`,
) {
  // Studio-dev's stored lifecycle uses ACCEPTED for a transaction whose
  // consensus result is already materialized (the raw lifecycle reports
  // FINALIZED separately). Polling for the numeric FINALIZED status first
  // needlessly waits until the SDK timeout, so use the decision boundary on
  // Studio and keep strict finalization semantics on other networks.
  if (client.chain.isStudio) {
    const decided = await retryStudioBusy(() => client.waitForDecision({ hash: transactionHash as `0x${string}` & { length: 66 } }));
    if (!isSuccessful(decided)) throw new Error(`GenLayer write failed: ${decided.statusName} / ${decided.txExecutionResultName}`);
    return decided;
  }
  try {
    return await retryStudioBusy(() => client.waitForFinalization({ hash: transactionHash as `0x${string}` & { length: 66 } }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Timed out waiting for transaction/i.test(message)) throw error;
    const decided = await retryStudioBusy(() => client.waitForDecision({ hash: transactionHash as `0x${string}` & { length: 66 } }));
    if (!isSuccessful(decided)) throw error;
    return decided;
  }
}

export async function createNegotiation(provider: Eip1193Provider, contractAddress: `0x${string}`, agreementId: string, partyB: `0x${string}`, policyVersion: string, knownAccount?: string): Promise<FormationWriteReceipt> {
  const { client } = await connectStudioDev(provider, knownAccount);
  return writeAndFinalize(client, contractAddress, "create_negotiation", [agreementId, partyB, policyVersion]);
}

export async function submitPartyVersion(provider: Eip1193Provider, contractAddress: `0x${string}`, input: PartyVersionInput, knownAccount?: string): Promise<FormationWriteReceipt> {
  const { client } = await connectStudioDev(provider, knownAccount);
  return writeAndFinalize(client, contractAddress, "submit_version", [input.agreementId, input.revision, input.party, input.commitment, input.semanticTerms, input.scope, input.evidence, input.deadline, input.quantity]);
}

export async function submitPartyVersionFromTerms(provider: Eip1193Provider, contractAddress: `0x${string}`, input: Omit<PartyVersionInput, "commitment">, knownAccount?: string): Promise<FormationWriteReceipt> {
  const commitment = await versionCommitmentHash({ ...input, policyVersion: "0.1" });
  return submitPartyVersion(provider, contractAddress, { ...input, commitment }, knownAccount);
}

export async function evaluateNegotiation(provider: Eip1193Provider, contractAddress: `0x${string}`, agreementId: string, revision: string, knownAccount?: string): Promise<ConsensusReceipt> {
  const { client } = await connectStudioDev(provider, knownAccount);
  const receipt = await writeAndFinalize(client, contractAddress, "evaluate_negotiation", [agreementId, revision]);
  const verdict = await retryStudioBusy(() => client.readContract({ address: contractAddress, functionName: "get_verdict", args: [agreementId] }));
  if (!isSemanticOutcome(verdict)) throw new Error(`Contract returned an invalid semantic verdict: ${String(verdict)}.`);
  return { transactionHash: receipt.transactionHash, outcome: verdict, finalized: true, executionSucceeded: true };
}

export async function ratifyNegotiation(provider: Eip1193Provider, contractAddress: `0x${string}`, agreementId: string, canonicalHash: string, knownAccount?: string): Promise<FormationWriteReceipt> {
  const { client } = await connectStudioDev(provider, knownAccount);
  return writeAndFinalize(client, contractAddress, "ratify", [agreementId, canonicalHash]);
}

export async function reviseNegotiation(provider: Eip1193Provider, contractAddress: `0x${string}`, agreementId: string, knownAccount?: string): Promise<FormationWriteReceipt> {
  const { client } = await connectStudioDev(provider, knownAccount);
  return writeAndFinalize(client, contractAddress, "revise_negotiation", [agreementId]);
}

export async function readFormationState(provider: Eip1193Provider, contractAddress: `0x${string}`, agreementId: string, knownAccount?: string) {
  const { client } = await connectStudioDev(provider, knownAccount);
  const [state, canonicalHash, ratifications, verdict, partyAddresses, receipt] = await Promise.all([
    retryStudioBusy(() => client.readContract({ address: contractAddress, functionName: "get_formation_state", args: [agreementId] })),
    retryStudioBusy(() => client.readContract({ address: contractAddress, functionName: "get_canonical_hash", args: [agreementId] })),
    retryStudioBusy(() => client.readContract({ address: contractAddress, functionName: "get_ratifications", args: [agreementId] })),
    retryStudioBusy(() => client.readContract({ address: contractAddress, functionName: "get_verdict", args: [agreementId] })),
    retryStudioBusy(() => client.readContract({ address: contractAddress, functionName: "get_party_addresses", args: [agreementId] })),
    retryStudioBusy(() => client.readContract({ address: contractAddress, functionName: "get_formation_receipt", args: [agreementId] })),
  ]);
  const [partyA, partyB] = typeof ratifications === "string" ? ratifications.split(":", 2) : ["", ""];
  const [partyAAddress, partyBAddress] = typeof partyAddresses === "string" ? partyAddresses.split(":", 2) : ["", ""];
  return { state: String(state), verdict: String(verdict), canonicalHash: String(canonicalHash), partyARatifiedHash: partyA, partyBRatifiedHash: partyB, partyAAddress, partyBAddress, receipt: String(receipt), parsedReceipt: parseFormationContractReceipt(receipt) };
}

export async function submitConsensus(
  provider: Eip1193Provider,
  contractAddress: `0x${string}`,
  input: ConsensusSubmission,
  knownAccount?: string,
): Promise<ConsensusReceipt> {
  const { client } = await connectStudioDev(provider, knownAccount);
  const write = { address: contractAddress, functionName: "evaluate", args: [input.agreementId, input.inputHash, input.buyerInterpretation, input.sellerInterpretation, input.question] };
  const estimate = await retryStudioBusy(() => client.estimateTransactionFeesForWrite(write));
  let transactionHash: `0x${string}`;
  try {
    transactionHash = await client.writeContract({ ...write, fees: { distribution: estimate.distribution, feeValue: estimate.feeValue } }) as `0x${string}`;
  } catch (error) {
    if (isStudioBusy(error)) throw new Error("Studio-dev is temporarily busy before the write could be confirmed. No automatic retry was sent; verify the on-chain state, then try again.");
    throw error;
  }
  const receipt = await waitForStudioFinalization(client, transactionHash);
  if (!isSuccessful(receipt)) throw new Error(`GenLayer write failed: ${receipt.statusName} / ${receipt.txExecutionResultName}`);
  const outcome = await retryStudioBusy(() => client.readContract({
    address: contractAddress,
    functionName: "get_outcome",
    args: [input.agreementId, input.inputHash],
  }));
  if (!isSemanticOutcome(outcome)) throw new Error("GenLayer returned an invalid semantic outcome");
  return { transactionHash, outcome, finalized: true, executionSucceeded: true };
}
