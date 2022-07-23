import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Link from "next/link";
import { ValidatorSummaryDetail } from "@src/types/validator";
import { udenomToDemom } from "@src/utils/mathHelpers";
import { AKTLabel } from "@src/components/shared/AKTLabel";
import { FormattedNumber } from "react-intl";
import { UrlService } from "@src/utils/urlUtils";

type Props = {
  errors?: string;
  validator: ValidatorSummaryDetail;
};

export const ValidatorRow: React.FunctionComponent<Props> = ({ validator }) => {
  return (
    <TableRow>
      <TableCell>{validator.rank}</TableCell>
      <TableCell>
        <Link href={UrlService.validator(validator.operatorAddress)}>
          <a>{validator.moniker}</a>
        </Link>
      </TableCell>
      <TableCell>
        <FormattedNumber value={udenomToDemom(validator.votingPower)} maximumFractionDigits={0} />
        &nbsp;
        <AKTLabel />
        &nbsp;(
        <FormattedNumber style="percent" value={validator.votingPowerRatio} minimumFractionDigits={2} />)
      </TableCell>
      <TableCell>
        <FormattedNumber style="percent" value={validator.commission} minimumFractionDigits={2} />
      </TableCell>
    </TableRow>
  );
};
