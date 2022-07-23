import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgDeposit: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO Missing Validator
  // ###################
  return (
    <>
      <MessageLabelValue label="Proposal Id" value={message?.data?.proposalId} />
      {/* TODO: Add link to proposal page */}
      <MessageLabelValue
        label="Depositor Address"
        value={
          <Link href={UrlService.address(message?.data?.depositor)}>
            <a>{message?.data?.depositor}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="Amount"
        value={
          <>
            {coinsToAmount(message?.data?.amount, "uakt", 6)}&nbsp;
            <AKTLabel />
          </>
        }
      />
    </>
  );
};
