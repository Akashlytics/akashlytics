import { TransactionMessage } from "@src/types";
import Link from "next/link";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgWithdrawValidatorCommission: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO Missing amount
  // ###################
  return (
    <>
      <MessageLabelValue label="Validator Address" value={message?.data?.validatorAddress} />
      {/* TODO: Add link to validator page + name*/}
      {/* <MessageLabelValue label="Amount" value={"TODO"} /> */}
    </>
  );
};
