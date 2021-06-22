import React from "react";
import { Chip, makeStyles } from "@material-ui/core";
import { FormattedNumber } from "react-intl";
import clsx from "clsx";
import ArrowDropUpIcon from "@material-ui/icons/ArrowDropUp";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

export interface DiffPercentageChipProps {
  value: number;
}

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: ".7rem",
    height: "1rem",
    marginLeft: ".5rem",
  },
  green: {
    backgroundColor: "#00945c",
  },
  red: {
    backgroundColor: "#840000",
  },
  label: {
    paddingLeft: "4px",
  },
}));

export const DiffPercentageChip: React.FunctionComponent<DiffPercentageChipProps> = ({ value }) => {
  const classes = useStyles();
  const isPositiveDiff = value && value > 0;

  return (
    <Chip
      size="small"
      className={clsx(
        { [classes.green]: isPositiveDiff, [classes.red]: !isPositiveDiff },
        classes.root
      )}
      classes={{ label: classes.label }}
      icon={isPositiveDiff ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
      label={<FormattedNumber style="percent" maximumFractionDigits={2} value={Math.abs(value)} />}
      // label="11.33%"
    />
  );
};
