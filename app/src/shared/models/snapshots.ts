
export enum Snapshots {
  activeDeployment = "activeDeployment",
  totalAKTSpent = "totalAKTSpent",
  allTimeDeploymentCount = "allTimeDeploymentCount",
  compute = "compute",
  memory = "memory",
  storage = "storage",
  dailyAktSpent = "dailyAktSpent",
  dailyDeploymentCount = "dailyDeploymentCount"
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
  min?: number;
  max?: number;
  average?: number;
  value?: number;
}

export type GraphResponse = {
  snapshots: SnapshotValue[];
  currentValue: number
}