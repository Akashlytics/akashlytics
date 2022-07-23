import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgFundCommunityPool: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  return (
    <>
      <MessageLabelValue
        label="Amount"
        value={
          <>
            {coinsToAmount(message?.data?.amount, "uakt", 6)}&nbsp;
            <AKTLabel />
          </>
        }
      />
      <MessageLabelValue
        label="Depositor"
        value={
          <Link href={UrlService.address(message?.data?.depositor)}>
            <a>{message?.data?.depositor}</a>
          </Link>
        }
      />
    </>
  );
};
