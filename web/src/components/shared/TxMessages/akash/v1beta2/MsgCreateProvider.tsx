import { DynamicReactJson } from "@src/components/shared/DynamicJsonView";
import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgCreateProvider: React.FunctionComponent<TxMessageProps> = ({ message }) => {
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
      <MessageLabelValue label="Host Uri" value={message?.data?.hostUri} />
      <MessageLabelValue label="Attributes" value={<DynamicReactJson src={JSON.parse(JSON.stringify(message?.data?.attributes))} />} />
      <MessageLabelValue label="Email" value={message?.data?.info?.email} />
      <MessageLabelValue label="Website" value={message?.data?.info?.website} />
    </>
  );
};
