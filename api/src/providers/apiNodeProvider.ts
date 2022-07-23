import fetch from "node-fetch";

const apiNodeUrl = "http://akash-node.akashlytics.com:1317";

export async function getAddressBalance(address: string) {
  const balancesQuery = fetch(`${apiNodeUrl}/cosmos/bank/v1beta1/balances/${address}?pagination.limit=1000`);
  const delegationsQuery = fetch(`${apiNodeUrl}/cosmos/staking/v1beta1/delegations/${address}?pagination.limit=1000`);
  const rewardsQuery = fetch(`${apiNodeUrl}/cosmos/distribution/v1beta1/delegators/${address}/rewards`);
  const redelegationsQuery = fetch(`${apiNodeUrl}/cosmos/staking/v1beta1/delegators/${address}/redelegations?pagination.limit=1000`);

  const [balancesResponse, delegatedResponse, rewardsResponse, redelegationsResponse] = await Promise.all([
    balancesQuery,
    delegationsQuery,
    rewardsQuery,
    redelegationsQuery
  ]);

  const balancesData = await balancesResponse.json();
  const delegationsData = await delegatedResponse.json();
  const rewardsData = await rewardsResponse.json();
  const redelegationsData = await redelegationsResponse.json();

  const assets = balancesData.balances.map((x) => ({
    denom: x.denom,
    amount: parseInt(x.amount)
  }));

  const delegations = delegationsData.delegation_responses.map((x) => ({
    validator: x.delegation.validator_address,
    amount: parseInt(x.balance.amount)
  }));

  for (const reward of rewardsData.rewards) {
    const delegation = delegations.find((x) => x.validator === reward.validator_address);
    if (delegation) {
      delegation.reward = parseFloat(reward.reward.find((x) => x.denom === "uakt").amount);
    } else {
      delegations.push({
        validator: reward.validator_address,
        amount: 0,
        reward: parseFloat(reward.reward.find((x) => x.denom === "uakt").amount)
      });
    }
  }

  const available = assets.filter((x) => x.denom === "uakt").reduce((acc, cur) => acc + cur.amount, 0);
  const delegated = delegations.reduce((acc, cur) => acc + cur.amount, 0);
  const rewards = rewardsData.total.lenght > 0 ? parseInt(rewardsData.total.find((x) => x.denom === "uakt").amount) : 0;
  const redelegations = redelegationsData.redelegation_responses.map((x) => ({
    srcAddress: x.redelegation.validator_src_address,
    dstAddress: x.redelegation.validator_dst_address,
    creationHeight: x.entries[0].redelegation_entry.creation_height,
    completionTime: x.entries[0].redelegation_entry.completion_time,
    amount: parseInt(x.entries[0].balance)
  }));

  return {
    total: available + delegated + rewards,
    delegations: delegations,
    available: available,
    delegated: delegated,
    rewards: rewards,
    assets: assets,
    redelegations: redelegations
  };
}

export async function getValidators() {
  const response = await fetch(`${apiNodeUrl}/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=1000`);
  const data = await response.json();

  const validators = data.validators.map((x) => ({
    operatorAddress: x.operator_address,
    moniker: x.description.moniker,
    votingPower: parseInt(x.tokens),
    commission: parseFloat(x.commission.commission_rates.rate),
    identity: x.description.identity
  }));

  const totalVotingPower = validators.reduce((acc, cur) => acc + cur.votingPower, 0);

  const sortedValidators = validators
    .sort((a, b) => b.votingPower - a.votingPower)
    .map((x, i) => ({
      ...x,
      votingPowerRatio: x.votingPower / totalVotingPower,
      rank: i + 1
    }));

  return sortedValidators;
}

export async function getValidator(address: string) {
  const response = await fetch(`${apiNodeUrl}/cosmos/staking/v1beta1/validators/${address}`);
  const data = await response.json();

  return {
    operatorAddress: data.validator.operator_address,
    moniker: data.validator.description.moniker,
    votingPower: parseInt(data.validator.tokens),
    commission: parseFloat(data.validator.commission.commission_rates.rate),
    maxCommission: parseFloat(data.validator.commission.commission_rates.max_rate),
    maxCommissionChange: parseFloat(data.validator.commission.commission_rates.max_change_rate),
    identity: data.validator.description.identity,
    description: data.validator.description.details,
    website: data.validator.description.website
  };
}
