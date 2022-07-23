import { useTheme } from "@mui/material/styles";
import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { DynamicReactJson } from "../../DynamicJsonView";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgTimeout: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  const theme = useTheme();
  // ###################
  // TODO missing IBC progress
  // ###################
  return (
    <>
      <MessageLabelValue label="Sequence" value={message?.data?.packet?.sequence} />
      <MessageLabelValue label="Source Port" value={message?.data?.packet?.sourcePort} />
      <MessageLabelValue label="Source Channel" value={message?.data?.packet?.sourceChannel} />
      <MessageLabelValue label="Destination Port" value={message?.data?.packet?.destinationPort} />
      <MessageLabelValue label="Destination Channel" value={message?.data?.packet?.destinationChannel} />
      <MessageLabelValue label="Data" value={<DynamicReactJson src={JSON.parse(Buffer.from(message?.data?.packet?.data, "base64").toString())} />} />
      <MessageLabelValue label="Timeout Revision Number" value={message?.data?.packet?.timeoutHeight?.revisionNumber} />
      <MessageLabelValue label="Timeout Revision Height" value={message?.data?.packet?.timeoutHeight?.revisionHeight} />
      <MessageLabelValue label="Timeout Timestamp" value={message?.data?.packet?.timeoutTimestamp} />
      <MessageLabelValue label="Proof Revision Number" value={message?.data?.proofHeight?.revisionHeight} />
      <MessageLabelValue label="Proof Reivison Height" value={message?.data?.proofHeight?.revisionNumber} />
      <MessageLabelValue label="Next Sequence Recv" value={message?.data?.nextSequenceRecv} />
      <MessageLabelValue
        label="Signer"
        value={
          <Link href={UrlService.address(message?.data?.signer)}>
            <a>{message?.data?.signer}</a>
          </Link>
        }
      />

      <MessageLabelValue label="IBC Progress" value={message?.data?.packet?.destinationChannel} />
    </>
  );
};
