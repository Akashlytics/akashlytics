import { SnapshotValue } from "@src/shared/models";
import { UseQueryOptions, useQuery } from "react-query";
import { queryKeys } from "./queryKeys";

async function getGraphSnaphot(snapshot: string): Promise<SnapshotValue[]> {
  const res = await fetch(`/api/getSnapshot/${snapshot}`);

  if (!res.ok) {
    throw new Error("Error when fetching graph snapshot");
  }

  const data = await res.json();
  return data;
}

export function useGraphSnapshot<TData = SnapshotValue[]>(snapshot: string, options?: UseQueryOptions<SnapshotValue[], Error, TData>) {
  return useQuery(queryKeys.graphs(snapshot), () => getGraphSnaphot(snapshot), options)
}