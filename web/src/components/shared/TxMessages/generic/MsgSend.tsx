import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgSend: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  return (
    <>
      <MessageLabelValue
        label="From Address"
        value={
          <Link href={UrlService.address(message?.data?.fromAddress)}>
            <a>{message?.data?.fromAddress}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="To Address"
        value={
          <Link href={UrlService.address(message?.data?.toAddress)}>
            <a>{message?.data?.toAddress}</a>
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
