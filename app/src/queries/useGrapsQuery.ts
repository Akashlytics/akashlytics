import { DailySpentGraphResponse, GraphResponse } from "@src/shared/models";
import { UseQueryOptions, useQuery } from "react-query";
import { queryKeys } from "./queryKeys";

async function getGraphSnaphot(snapshot: string): Promise<GraphResponse> {
  const res = await fetch(`/api/getSnapshot/${snapshot}`);

  if (!res.ok) {
    throw new Error("Error when fetching graph snapshot");
  }

  const data = await res.json();
  return data;
}

export function useGraphSnapshot<TData = GraphResponse>(snapshot: string, options?: UseQueryOptions<GraphResponse, Error, TData>) {
  return useQuery(queryKeys.graphs(snapshot), () => getGraphSnaphot(snapshot), options)
}

async function getRevenueGraph(): Promise<DailySpentGraphResponse> {
  const res = await fetch("/api/getDailySpentGraph");
  
  if (!res.ok) {
    throw new Error("Error when fetching graph snapshot");
  }
  
  const data = await res.json();
  return data;
}

export function useRevenueGraph<TData = DailySpentGraphResponse>(options?: UseQueryOptions<DailySpentGraphResponse, Error, TData>) {
  return useQuery(queryKeys.dailySpentGraph(), () => getRevenueGraph(), options)
}