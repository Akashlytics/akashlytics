export const averageBlockTime = 6.174;
export const averageDaysInMonth = 30.437;
export const averageBlockCountInAMonth = averageDaysInMonth * 24 * 60 * 60 / averageBlockTime;
export const isProd = process.env.NODE_ENV === "production";

export enum ExecutionMode {
  DoNotSync,
  SyncOnly,
  DownloadAndSync,
  RebuildStats,
  RebuildAll
}

export const executionMode: ExecutionMode = isProd ? ExecutionMode.DownloadAndSync : ExecutionMode.DoNotSync;
export const lastBlockToSync = 150_000;//Number.POSITIVE_INFINITY;

export const mainNet = "https://raw.githubusercontent.com/ovrclk/net/master/mainnet";
export const testNet = "https://raw.githubusercontent.com/ovrclk/net/master/testnet";
export const edgeNet = "https://raw.githubusercontent.com/ovrclk/net/master/edgenet";
