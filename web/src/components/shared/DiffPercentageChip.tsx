import React from "react";
import { FormattedNumber } from "react-intl";
import clsx from "clsx";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { makeStyles } from "tss-react/mui";
import Chip from "@mui/material/Chip";

export interface DiffPercentageChipProps {
  value: number;
  size?: "small" | "medium";
}

const useStyles = makeStyles()(theme => ({
  root: {
    marginLeft: ".5rem"
  },
  small: {
    fontSize: ".7rem",
    height: "1rem"
  },
  medium: {
    fontSize: ".8rem",
    height: "1.2rem"
  },
  green: {
    backgroundColor: "#00945c" // TODO Theme
  },
  red: {
    backgroundColor: "transparent"
  },
  label: {
    paddingLeft: "4px"
  }
}));

export const DiffPercentageChip: React.FunctionComponent<DiffPercentageChipProps> = ({ value, size = "small" }) => {
  if (typeof value !== "number") return null;

  const { classes } = useStyles();
  const isPositiveDiff = value >= 0;

  return (
    <Chip
      size={size}
      className={clsx(
        {
          [classes.green]: isPositiveDiff,
          [classes.red]: !isPositiveDiff,
          [classes.small]: size === "small",
          [classes.medium]: size === "medium"
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
