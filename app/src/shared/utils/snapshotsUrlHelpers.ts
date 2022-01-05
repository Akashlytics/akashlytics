import { Snapshots, SnapshotsUrlParam } from "../models";

export const NOT_FOUND = "NOT_FOUND";

export const urlParamToSnapshot = (snapshotsUrlParam: SnapshotsUrlParam) => {
  switch (snapshotsUrlParam) {
    case SnapshotsUrlParam.activeDeployment:
      return Snapshots.activeLeaseCount;
    case SnapshotsUrlParam.allTimeDeploymentCount:
      return Snapshots.totalLeaseCount;
    case SnapshotsUrlParam.compute:
      return Snapshots.activeCPU;
    case SnapshotsUrlParam.memory:
      return Snapshots.activeMemory;
    case SnapshotsUrlParam.storage:
      return Snapshots.activeStorage;
    case SnapshotsUrlParam.totalAKTSpent:
      return Snapshots.totalUAktSpent;
    case SnapshotsUrlParam.dailyAktSpent:
      return Snapshots.dailyUAktSpent;
    case SnapshotsUrlParam.dailyDeploymentCount:
      return Snapshots.dailyLeaseCount;

    default:
      return NOT_FOUND;
  }
}