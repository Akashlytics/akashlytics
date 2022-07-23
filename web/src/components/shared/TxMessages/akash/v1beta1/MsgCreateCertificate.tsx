import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgCreateCertificate: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  return (
    <>
      <MessageLabelValue
        label="Owner"
        value={
          <Link href={UrlService.address(message?.data?.owner)}>
            <a>{message?.data?.owner}</a>
          </Link>
        }
      />
      <MessageLabelValue label="Cert" value={message?.data?.cert} />
      <MessageLabelValue label="Pubkey" value={message?.data?.pubkey} />
    </>
  );
};
