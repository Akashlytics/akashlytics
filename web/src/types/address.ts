import { Coin } from "./coin";

export interface AddressDetail {
  total: number;
  available: number;
  delegated: number;
  rewards: number;
  assets: Coin;
  delegations: DelegationDetail[];
  redelegations: RedelegationDetail[];
}

export interface DelegationDetail {
  validator: string;
  amount: number;
  reward: number;
}

export interface RedelegationDetail {
  srcAddress: string;
  dstAddress: string;
  creationHeight: number;
  completionTime: string;
  amount: number;
}
