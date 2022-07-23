import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgCreateClient: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing Client Id, Client Type, Chain Id, Trusting Period, Unbonding Period, Timestamp
  // ###################
  return (
    <>
      <MessageLabelValue label="Client Id" value={message?.data?.packet?.sequence} />
      <MessageLabelValue label="Client Type" value={message?.data?.packet?.sequence} />
      <MessageLabelValue label="Chain Id" value={message?.data?.packet?.sequence} />
      <MessageLabelValue label="Trusting Period" value={message?.data?.packet?.sequence} />
      <MessageLabelValue label="Unbonding Period" value={message?.data?.packet?.sequence} />
      <MessageLabelValue label="Timestamp" value={message?.data?.packet?.sequence} />
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
