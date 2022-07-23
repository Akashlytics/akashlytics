import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgConnectionOpenConfirm: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO missing everything
  // ###################
  return (
    <>
      <MessageLabelValue label="Connection Id" value={message?.data?.connectionId} />
      <MessageLabelValue label="Proof Ack" value={message?.data?.proofAck} />
      <MessageLabelValue label="Revision Number" value={message?.data?.proofHeight?.revisionNumber} />
      <MessageLabelValue label="Revision Height" value={message?.data?.proofHeight?.revisionHeight} />
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
