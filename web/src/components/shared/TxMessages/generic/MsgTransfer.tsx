import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgTransfer: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing sequence
  // ###################
  return (
    <>
      <MessageLabelValue
        label="Sender"
        value={
          <Link href={UrlService.address(message?.data?.sender)}>
            <a>{message?.data?.sender}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="Receiver"
        value={
          <Link href={UrlService.address(message?.data?.receiver)}>
            <a>{message?.data?.receiver}</a>
          </Link>
        }
      />
      <MessageLabelValue label="Source Channel" value={message?.data?.sourceChannel} />
      <MessageLabelValue label="Port" value={message?.data?.sourcePort} />
      {/* <MessageLabelValue label="Sequence" value={"TODO"} /> */}
      <MessageLabelValue
        label="Amount"
        value={
          <>
            {coinsToAmount(message?.data?.token, "uakt", 6)}&nbsp;
            <AKTLabel />
          </>
        }
      />
      <MessageLabelValue label="Origin Amount" value={message?.data?.token?.amount} />
      <MessageLabelValue label="Origin Denom" value={message?.data?.token?.denom} />
    </>
  );
};
