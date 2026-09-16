export const STUDIO_DEV_EXPLORER_BASE_URL = "https://explorer-studio-dev.genlayer.com";

export function explorerUrl(kind: "tx" | "address", value: string) {
  return `${STUDIO_DEV_EXPLORER_BASE_URL}/${kind}/${value}`;
}
