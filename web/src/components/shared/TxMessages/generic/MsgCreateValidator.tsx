import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgCreateValidator: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  // ###################
  // TODO minSelftDelegation as a coin
  // TODO commissions DecCoin
  // ###################
  console.log(message);
  return (
    <>
      <MessageLabelValue
        label="Min Self Delegation"
        value={
          <>
            {/* {coinsToAmount([message?.data?.minSelfDelegation], "uakt", 6)}&nbsp; */}
            {message?.data?.minSelfDelegation}&nbsp;
            <AKTLabel />
          </>
        }
      />
      <MessageLabelValue
        label="Delegator Address"
        value={
          <Link href={UrlService.address(message?.data?.delegatorAddress)}>
            <a>{message?.data?.delegatorAddress}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="Validator Address"
        value={
          <Link href={UrlService.validator(message?.data?.validatorAddress)}>
            <a>{message?.data?.validatorAddress}</a>
          </Link>
        }
      />
      <MessageLabelValue
        label="Value"
        value={
          <>
            {coinsToAmount(message?.data?.value, "uakt", 6)}&nbsp;
            <AKTLabel />
          </>
        }
      />
      <MessageLabelValue label="Details" value={message?.data?.description?.details} />
      <MessageLabelValue label="Moniker" value={message?.data?.description?.moniker} />
      <MessageLabelValue
        label="Website"
        value={
          <a href={message?.data?.description?.website} target="_blank">
            {message?.data?.description?.website}
          </a>
        }
      />
      <MessageLabelValue label="Identity" value={message?.data?.description?.identity} />
      <MessageLabelValue label="Security Contact" value={message?.data?.description?.securityContact} />
      <MessageLabelValue label="Commission Rate" value={message?.data?.commission?.rate} />
      <MessageLabelValue label="Commission Max Rate" value={message?.data?.commission?.maxRate} />
      <MessageLabelValue label="Commission Max Change Rate" value={message?.data?.commission?.maxChangeRate} />
      <MessageLabelValue label="Public Key" value={message?.data?.pubkey?.value} />
    </>
  );
};
