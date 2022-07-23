import Typography from "@mui/material/Typography";
import { TransactionMessage } from "@src/types";
import { coinsToAmount } from "@src/utils/mathHelpers";
import { UrlService } from "@src/utils/urlUtils";
import Link from "next/link";
import { AKTLabel } from "../../AKTLabel";
import { MessageLabelValue } from "../MessageLabelValue";

type TxMessageProps = {
  message: TransactionMessage;
};

export const MsgMultiSend: React.FunctionComponent<TxMessageProps> = ({ message }) => {
  const senders = message.data?.inputs.map(input => (
    <div key={input.address}>
      <Link href={UrlService.address(input.address)}>
        <a>{input.address}</a>
      </Link>
      &nbsp;
      <Typography variant="caption">
        ({coinsToAmount(input.coins, "uakt", 6)}&nbsp;
        <AKTLabel />)
      </Typography>
    </div>
  ));
  const receivers = message.data?.outputs.map(input => (
    <div key={input.address}>
      <Link href={UrlService.address(input.address)}>
        <a>{input.address}</a>
      </Link>
      &nbsp;
      <Typography variant="caption">
        ({coinsToAmount(input.coins, "uakt", 6)}&nbsp;
        <AKTLabel />)
      </Typography>
    </div>
  ));
  return (
    <>
      <MessageLabelValue label="Senders" value={senders} />
      <MessageLabelValue label="Receivers" value={receivers} />
    </>
  );
};
