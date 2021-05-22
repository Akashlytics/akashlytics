import { Snapshots, SnapshotsUrlParam } from "../models";

export const NOT_FOUND = "NOT_FOUND";

export const urlParamToSnapshot = (snapshotsUrlParam: SnapshotsUrlParam) => {
  switch (snapshotsUrlParam) {
    case SnapshotsUrlParam.activeDeployment:
      return Snapshots.activeDeployment;
    case SnapshotsUrlParam.allTimeDeploymentCount:
      return Snapshots.allTimeDeploymentCount;
    case SnapshotsUrlParam.compute:
      return Snapshots.compute;
    case SnapshotsUrlParam.memory:
      return Snapshots.memory;
    case SnapshotsUrlParam.storage:
      return Snapshots.storage;
    case SnapshotsUrlParam.totalAKTSpent:
      return Snapshots.totalAKTSpent;

    default:
      return NOT_FOUND;
  }
}