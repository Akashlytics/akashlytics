import { baseApiUrl } from "@src/shared/contants";
import { DashboardData } from "@src/shared/models";
import { UseQueryOptions, useQuery } from "react-query";
import { queryKeys } from "./queryKeys";

async function getDashboardData(): Promise<DashboardData> {
  const res = await fetch(`${baseApiUrl}/api/getDashboardData`);

  if (!res.ok) {
    throw new Error("Error when fetching graph snapshot");
  }

  const data = await res.json();
  return data;
}

export function useDashboardData<TData = DashboardData>(options?: UseQueryOptions<DashboardData, Error, TData>) {
  return useQuery(queryKeys.dashboardData(), () => getDashboardData(), options)
}