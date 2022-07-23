export function getFriendlyProposalType(typeUrl: string) {
  return typeUrl.split(".").at(-1).split("Proposal")[0];
}
