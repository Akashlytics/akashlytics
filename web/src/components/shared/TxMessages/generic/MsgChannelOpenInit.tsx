import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { DynamicReactJson } from "../../DynamicJsonView";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgChannelOpenInit: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  return (
    <>
      <MessageLabelValue label="Port Id" value={message?.data?.portId} />
      <MessageLabelValue label="State" value={message?.data?.channel?.state} />
      <MessageLabelValue label="Ordering" value={message?.data?.channel?.ordering} />
      <MessageLabelValue label="Channel Id" value={message?.data?.channel?.counterparty?.channelId} />
      <MessageLabelValue label="Connection Hops" value={<DynamicReactJson src={JSON.parse(JSON.stringify(message?.data?.channel?.connectionHops))} />} />
      <MessageLabelValue label="Version" value={message?.data?.channel?.version} />
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
