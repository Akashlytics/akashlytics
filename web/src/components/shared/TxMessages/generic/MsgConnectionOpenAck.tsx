import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { DynamicReactJson } from "../../DynamicJsonView";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgConnectionOpenAck: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing everything
  // ###################
  return (
    <>
      <MessageLabelValue label="@type" value={message?.data?.clientState?.typeUrl} />
      <MessageLabelValue label="Connection Id" value={message?.data?.connectionId} />
      <MessageLabelValue label="Counterparty Connection Id" value={message?.data?.counterpartyConnectionId} />
      <MessageLabelValue label="Identifier" value={message?.data?.version?.identifier} />
      <MessageLabelValue label="Features" value={<DynamicReactJson src={JSON.parse(JSON.stringify(message?.data?.version?.features))} />} />
      <MessageLabelValue label="Chain Id" value={"TODO"} />
      <MessageLabelValue label="Numerator" value={"TODO"} />
      <MessageLabelValue label="Denominator" value={"TODO"} />
      <MessageLabelValue label="Trusting Period" value={"TODO"} />
      <MessageLabelValue label="Unbonding Period" value={"TODO"} />
      <MessageLabelValue label="Max Clock Drift" value={"TODO"} />
      <MessageLabelValue label="Revision Number" value={message?.data?.proofHeight?.revisionNumber} />
      <MessageLabelValue label="Revision Height" value={message?.data?.proofHeight?.revisionHeight} />
      <MessageLabelValue label="Proof Specs" value={"TODO"} />
      <MessageLabelValue label="Upgrade Path" value={"TODO"} />
      <MessageLabelValue label="Allow Update After Expiry" value={"TODO"} />
      <MessageLabelValue label="Allow Update After Misbehaviour" value={"TODO"} />
      <MessageLabelValue label="Proof Try" value={message?.data?.proofTry} />
      <MessageLabelValue label="Proof Client" value={message?.data?.proofClient} />
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
