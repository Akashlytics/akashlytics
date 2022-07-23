import { DynamicReactJson } from "@src/components/shared/DynamicJsonView";
import { TransactionMessage } from "@src/types";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgDeleteProviderAttributes: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  return (
    <>
      <MessageLabelValue
        label="Provider"
        value={
          <Link href={UrlService.address(message?.data?.owner)}>
            <a>{message?.data?.owner}</a>
          </Link>
        }
      />
      {/* TODO: Add link to provider page */}
      <MessageLabelValue
        label="Auditor"
        value={
          <Link href={UrlService.address(message?.data?.auditor)}>
            <a>{message?.data?.auditor}</a>
          </Link>
        }
      />
      <MessageLabelValue label="Keys" value={<DynamicReactJson src={JSON.parse(JSON.stringify(message?.data?.keys))} />} />
    </>
  );
};
