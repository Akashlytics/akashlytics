export const averageBlockTime = 6.174;
export const isProd = process.env.NODE_ENV === "production";

export enum ExecutionMode {
  SyncOnly,
  DownloadAndSync,
  RebuildStats,
  RebuildAll
}

export const executionMode: ExecutionMode = isProd ? ExecutionMode.DownloadAndSync : ExecutionMode.SyncOnly;

export const mainNet = "https://raw.githubusercontent.com/ovrclk/net/master/mainnet";
export const testNet = "https://raw.githubusercontent.com/ovrclk/net/master/testnet";
export const edgeNet = "https://raw.githubusercontent.com/ovrclk/net/master/edgenet";