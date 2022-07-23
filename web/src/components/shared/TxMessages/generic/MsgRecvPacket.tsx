import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgRecvPacket: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing amount, originAmount, originDenom, receiver, sender, effected
  // ###################

  return (
    <>
      <MessageLabelValue label="Sequence" value={message?.data?.packet?.sequence} />
      {/* <MessageLabelValue
        label="Amount"
        value={
          <>
            TODO
            <AKTLabel />
          </>
        }
      />
      <MessageLabelValue
        label="Origin Amount"
        value={
          <>
            TODO
            <AKTLabel />
          </>
        }
      />
      <MessageLabelValue
        label="Origin Denom"
        value={
          <>
            TODO
            <AKTLabel />
          </>
        }
      /> */}
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
      {/* <MessageLabelValue
        label="Receiver"
        value={
          <Link href={UrlService.address(message?.data?.signer)}>
            <a>{message?.data?.signer}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="Sender"
        value={
          <Link href={UrlService.address(message?.data?.signer)}>
            <a>{message?.data?.signer}</a>
          </Link>
        }
      /> */}
      <MessageLabelValue label="Effected" value={message?.data?.effected} />
    </>
  );
};
