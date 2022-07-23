import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgConnectionOpenTry: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing everything
  // ###################
  return (
    <>
      <MessageLabelValue label="@type" value={message?.data?.clientState?.typeUrl} />
      <MessageLabelValue label="Client Id" value={message?.data?.clientId} />
      <MessageLabelValue label="Previous Connection Id" value={message?.data?.previoudConnectionId} />
      {/* <MessageLabelValue label="Chain Id" value={"TODO"} />
      <MessageLabelValue label="Numerator" value={"TODO"} />
      <MessageLabelValue label="Denominator" value={"TODO"} />
      <MessageLabelValue label="Trusting Period" value={"TODO"} />
      <MessageLabelValue label="Unbonding Period" value={"TODO"} />
      <MessageLabelValue label="Max Clock Drift" value={"TODO"} /> */}
      <MessageLabelValue label="Revision Number" value={message?.data?.proofHeight?.revisionNumber} />
      <MessageLabelValue label="Revision Height" value={message?.data?.proofHeight?.revisionHeight} />
      {/* <MessageLabelValue label="Proof Specs" value={"TODO"} />
      <MessageLabelValue label="Upgrade Path" value={"TODO"} />
      <MessageLabelValue label="Allow Update After Expiry" value={"TODO"} />
      <MessageLabelValue label="Allow Update After Misbehaviour" value={"TODO"} /> */}
      <MessageLabelValue label="Connection Id" value={message?.data?.counterparty?.connectionId} />
      <MessageLabelValue label="Key Prefix" value={message?.data?.counterparty?.prefix?.keyPrefix} />
      <MessageLabelValue label="Delay Period" value={message?.data?.delayPeriod} />
      {/* <MessageLabelValue label="Counterparty Versions" value={"TODO"} />
      <MessageLabelValue label="Proof Init" value={"TODO"} />
      <MessageLabelValue label="Proof Client" value={"TODO"} /> */}
      <MessageLabelValue label="Proof Consensus" value={message?.data?.proofConsensus} />
      <MessageLabelValue
        label="Signer"
        value={
          <Link href={UrlService.address(message?.data?.signer)}>
            <a>{message?.data?.signer}</a>
          </Link>
        }
      />
    </>
  );
};
