import { AKTLabel } from "@src/components/shared/AKTLabel";
import { DynamicReactJson } from "@src/components/shared/DynamicJsonView";
import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { MessageLabelValue } from "../../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgCreateDeployment: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO group resources from base 64
  // ###################
  return (
    <>
      <MessageLabelValue
        label="Owner"
        value={
          <Link href={UrlService.address(message?.data?.id?.owner)}>
            <a>{message?.data?.id?.owner}</a>
          </Link>
        }
      />
      <MessageLabelValue label="dseq" value={message?.data?.id?.dseq} />
      {/* TODO: Add link to deployment page */}
      <MessageLabelValue label="Version" value={message?.data?.version} />
      <MessageLabelValue
        label="Depositor"
        value={
          <Link href={UrlService.address(message?.data?.depositor)}>
            <a>{message?.data?.depositor}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="Deposit"
        value={
          <>
            {coinsToAmount(message?.data?.deposit, "uakt", 6)}&nbsp;
            <AKTLabel />
          </>
        }
      />
      <MessageLabelValue label="Groups" value={<DynamicReactJson src={JSON.parse(JSON.stringify(message?.data?.groups))} />} />
    </>
  );
};
