import { UseQueryOptions, useQuery, QueryKey } from "react-query";
import axios from "axios";
import { QueryKeys } from "./queryKeys";
import { BASE_API_URL } from "@src/utils/constants";
import { ValidatorSummaryDetail } from "@src/types/validator";

async function getValidators(): Promise<ValidatorSummaryDetail[]> {
  const response = await axios.get(`${BASE_API_URL}/api/validators`);
  return response.data;
}

export function useValidators(options?: Omit<UseQueryOptions<ValidatorSummaryDetail[], Error, any, QueryKey>, "queryKey" | "queryFn">) {
  return useQuery<ValidatorSummaryDetail[], Error>(QueryKeys.getValidatorsKey(), () => getValidators(), options);
}
