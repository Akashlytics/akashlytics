import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgWithdrawDelegatorReward: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO Missing amount
  // ###################
  return (
    <>
      <MessageLabelValue
        label="Delegator Adrress"
        value={
          <Link href={UrlService.address(message?.data?.delegatorAddress)}>
            <a>{message?.data?.delegatorAddress}</a>
          </Link>
        }
      />
      <MessageLabelValue label="Validator Address" value={message?.data?.validatorAddress} />
      {/* TODO: Add link to validator page + name*/}
      <MessageLabelValue label="Amount" value={"TODO"} />
    </>
  );
};
