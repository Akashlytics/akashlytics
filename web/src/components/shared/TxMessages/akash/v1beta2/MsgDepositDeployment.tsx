import { AKTLabel } from "@src/components/shared/AKTLabel";
import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import Link from "next/link";
import { MessageLabelValue } from "../../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgDepositDeployment: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  return (
    <>
      <MessageLabelValue
        label="Owner"
        value={
          <Link href="TODO">
            <a>{message?.data?.id?.owner}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="dseq"
        value={
          <Link href="TODO">
            <a>{message?.data?.id?.dseq}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="Depositor"
        value={
          <Link href="TODO">
            <a>{message?.data?.depositor}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="Deposit"
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
