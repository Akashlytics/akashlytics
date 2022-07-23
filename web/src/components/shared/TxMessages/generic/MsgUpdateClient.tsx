import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgUpdateClient: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing block, app, chainId, height, time, hash, total, lastCommitHash, dataHash, validatorsHash, nextValidatorsHash, consensusHash, appHash, appHash, lastResulstsHash, evidenceHash, proposerAddress
  // ###################
  return (
    <>
      <MessageLabelValue
        label="Signer"
        value={
          <Link href={UrlService.address(message?.data?.signer)}>
            <a>{message?.data?.signer}</a>
          </Link>
        }
      />
      <MessageLabelValue label="Client Id" value={message?.data?.clientId} />
      {/* <MessageLabelValue label="Block" value={message?.data?.channel?.state} />
      <MessageLabelValue label="App" value={message?.data?.channel?.ordering} />
      <MessageLabelValue label="Chain Id" value={message?.data?.channel?.counterparty?.channelId} />
      <MessageLabelValue label="Height" value={message?.data?.height} />
      <MessageLabelValue label="Time" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Total" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Last Commit Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Data Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Validators Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Next Validators Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Consensus Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="App Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Last Results Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Evidence Hash" value={message?.data?.channel?.version} />
      <MessageLabelValue label="Proposer Address" value={message?.data?.channel?.version} /> */}
    </>
  );
};
