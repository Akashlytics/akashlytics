import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgAcknowledgement: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing Amount, Origin Amount, Origin Denom, Sender, Effected
  // ###################
  return (
    <>
      <MessageLabelValue label="Sequence" value={message?.data?.packet?.sequence} />
      {/* <MessageLabelValue label="Amount" value={"TODO"} />
      <MessageLabelValue label="Origin Amount" value={"TODO"} />
      <MessageLabelValue label="Origin Denom" value={"TODO"} />
      <MessageLabelValue label="Receiver" value={"TODO"} />
      <MessageLabelValue label="Sender" value={"TODO"} /> */}
      <MessageLabelValue label="Source Port" value={message?.data?.packet?.sourcePort} />
      <MessageLabelValue label="Source Channel" value={message?.data?.packet?.sourceChannel} />
      <MessageLabelValue label="Destination Port" value={message?.data?.packet?.destinationPort} />
      <MessageLabelValue label="Destination Channel" value={message?.data?.packet?.destinationChannel} />
      <MessageLabelValue
        label="Signer"
        value={
          <Link href={UrlService.address(message?.data?.signer)}>
            <a>{message?.data?.signer}</a>
          </Link>
        }
      />
      <MessageLabelValue label="Effected" value={message?.data?.clientId} />
    </>
  );
};
