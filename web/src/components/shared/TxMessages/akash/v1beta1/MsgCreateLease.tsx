import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgCreateLease: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  return (
    <>
      <MessageLabelValue
        label="Provider"
        value={
          <Link href={UrlService.address(message?.data?.bidId?.provider)}>
            <a>{message?.data?.bidId?.provider}</a>
          </Link>
        }
      />
      {/* TODO: Add link to provider page */}
      <MessageLabelValue
        label="Owner"
        value={
          <Link href={UrlService.address(message?.data?.bidId?.owner)}>
            <a>{message?.data?.bidId?.owner}</a>
          </Link>
        }
      />
      <MessageLabelValue label="dseq" value={message?.data?.bidId?.dseq} />
      {/* TODO: Add link to deployment page */}
      <MessageLabelValue label="gseq" value={message?.data?.bidId?.gseq} />
      <MessageLabelValue label="oseq" value={message?.data?.bidId?.oseq} />
    </>
  );
};
