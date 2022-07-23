import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgBeginRedelegate: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO Missing Auto claim reward
  // ###################
  return (
    <>
      <MessageLabelValue
        label="Delegator Address"
        value={
          <Link href={UrlService.address(message?.data?.delegatorAddress)}>
            <a>{message?.data?.delegatorAddress}</a>
          </Link>
        }
      />
      <MessageLabelValue label="Source Validator Address" value={message?.data?.validatorSrcAddress} />
      {/* TODO: Add link to validator page */}
      <MessageLabelValue label="Destination Validator Address" value={message?.data?.validatorDstAddress} />
      {/* TODO: Add link to validator page */}
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
