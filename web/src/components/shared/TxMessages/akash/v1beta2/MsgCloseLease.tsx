import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgCloseLease: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  return (
    <>
      <MessageLabelValue
        label="Owner"
        value={
          <Link href={UrlService.address(message?.data?.leaseId?.owner)}>
            <a>{message?.data?.leaseId?.owner}</a>
          </Link>
        }
      />
      <MessageLabelValue label="dseq" value={message?.data?.leaseId?.dseq} />
      {/* TODO: Add link to deployment page */}
      <MessageLabelValue label="gseq" value={message?.data?.leaseId?.gseq} />
      <MessageLabelValue label="oseq" value={message?.data?.leaseId?.oseq} />
      <MessageLabelValue
        label="Provider"
        value={
          <Link href={UrlService.address(message?.data?.leaseId?.provider)}>
            <a>{message?.data?.leaseId?.provider}</a>
          </Link>
        }
      />
      {/* TODO: Add link to provider page */}
    </>
  );
};
