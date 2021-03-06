
export enum Snapshots {
  activeLeaseCount = "activeLeaseCount",
  totalUAktSpent = "totalUAktSpent",
  totalLeaseCount = "totalLeaseCount",
  activeCPU = "activeCPU",
  activeMemory = "activeMemory",
  activeStorage = "activeStorage",
  dailyUAktSpent = "dailyUAktSpent",
  dailyLeaseCount = "dailyLeaseCount"
}

export enum SnapshotsUrlParam {
  activeDeployment = "active-deployment",
  totalAKTSpent = "total-akt-spent",
  allTimeDeploymentCount = "all-time-deployment-count",
  compute = "compute",
  memory = "memory",
  storage = "storage",
  dailyAktSpent = "daily-akt-spent",
  dailyDeploymentCount = "daily-deployment-count"
}

export interface SnapshotValue {
  date: string;
  value?: number;
}

export type GraphResponse = {
  snapshots: SnapshotValue[];
  currentValue: number,
  compareValue: number
}