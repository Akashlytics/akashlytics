import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgUpgradeClient: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing everything
  // ###################
  return (
    <>
      <MessageLabelValue label="@type" value={message?.data?.consensusState?.typeUrl} />
      {/* <MessageLabelValue label="Client Id" value={"TODO"} />
      <MessageLabelValue label="Chain Id" value={"TODO"} />
      <MessageLabelValue label="Numerator" value={"TODO"} />
      <MessageLabelValue label="Denominator" value={"TODO"} />
      <MessageLabelValue label="Trusting Period" value={"TODO"} />
      <MessageLabelValue label="Unbonding Period" value={"TODO"} />
      <MessageLabelValue label="Max Clock Drift" value={"TODO"} />
      <MessageLabelValue label="Revision Number" value={"TODO"} />
      <MessageLabelValue label="Revision Height" value={"TODO"} />
      <MessageLabelValue label="Proof Specs" value={"TODO"} />
      <MessageLabelValue label="Upgrade Path" value={"TODO"} />
      <MessageLabelValue label="Allow Update After Expiry" value={"TODO"} />
      <MessageLabelValue label="Allow Update After Misbehaviour" value={"TODO"} />
      <MessageLabelValue label="Timestamp" value={"TODO"} />
      <MessageLabelValue label="Hash" value={"TODO"} />
      <MessageLabelValue label="Next Validators Hash" value={"TODO"} /> */}
      <MessageLabelValue label="Proof Upgrade Client" value={message?.data?.proofUpgradeClient} />
      <MessageLabelValue label="Proof Upgrade Consensus State" value={message?.data?.proofUpgradeConsensusState} />
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
