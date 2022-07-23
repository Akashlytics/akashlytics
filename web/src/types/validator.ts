export interface ValidatorSummaryDetail {
  rank: number;
  operatorAddress: string;
  moniker: string;
  votingPower: number;
  votingPowerRatio: number;
  commission: number;
  identity: string;
}

export interface ValidatorDetail {
  rank: number;
  operatorAddress: string;
  moniker: string;
  votingPower: number;
  commission: number;
  maxCommission: number;
  maxCommissionChange: number;
  identity: string;
  description: string;
  website: string;
}
