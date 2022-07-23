import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgSubmitProposal: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO Missing ProposalId, ProposalType, Title
  // ###################
  return (
    <>
      <MessageLabelValue
        label="Initial Deposit"
        value={
          <>
            {coinsToAmount(message?.data?.initialDeposit, "uakt", 6)}&nbsp;
            <AKTLabel />
          </>
        }
      />
      <MessageLabelValue
        label="Proposer"
        value={
          <Link href={UrlService.address(message?.data?.proposer)}>
            <a>{message?.data?.proposer}</a>
          </Link>
        }
      />
      {/* <MessageLabelValue
        label="Proposal Id"
        value={
          <Link href="TODO">
            <a>{message?.data?.proposalId}</a>
          </Link>
        }
      /> */}
      <MessageLabelValue label="Proposal Type" value={message?.data?.content.typeUrl.split(".").at(-1).split("Proposal")[0]} />
      {/* <MessageLabelValue label="Title" value={"TODO"} /> */}
    </>
  );
};
