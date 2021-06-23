import React from "react";
import { Chip, makeStyles } from "@material-ui/core";
import { FormattedNumber } from "react-intl";
import clsx from "clsx";
import ArrowDropUpIcon from "@material-ui/icons/ArrowDropUp";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

export interface DiffPercentageChipProps {
  value: number;
  size?: "small" | "medium";
}

const useStyles = makeStyles((theme) => ({
  root: {
    marginLeft: ".5rem",
  },
  small: {
    fontSize: ".7rem",
    height: "1rem",
  },
  medium: {
    fontSize: ".8rem",
    height: "1.2rem",
  },
  green: {
    backgroundColor: "#00945c",
  },
  red: {
    // backgroundColor: "#840000",
    backgroundColor: "transparent",
  },
  label: {
    paddingLeft: "4px",
  },
}));

export const DiffPercentageChip: React.FunctionComponent<DiffPercentageChipProps> = ({
  value,
  size = "small",
}) => {
  if (typeof value !== "number") return null;

  const classes = useStyles();
  const isPositiveDiff = value >= 0;

  return (
    <Chip
      size={size}
      className={clsx(
        {
          [classes.green]: isPositiveDiff,
          [classes.red]: !isPositiveDiff,
          [classes.small]: size === "small",
          [classes.medium]: size === "medium",
        },
        classes.root
      )}
      classes={{ label: classes.label }}
      icon={isPositiveDiff ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
      label={<FormattedNumber style="percent" maximumFractionDigits={2} value={Math.abs(value)} />}
      // label="11.33%"
    />
  );
};
