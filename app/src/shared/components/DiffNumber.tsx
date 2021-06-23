import React from "react";
import { makeStyles } from "@material-ui/core";
import { FormattedNumber } from "react-intl";

export interface DiffNumberProps {
  value: number;
  className?: string;
}

const useStyles = makeStyles((theme) => ({}));

export const DiffNumber: React.FunctionComponent<DiffNumberProps> = ({ value, className = "" }) => {
  if (typeof value !== "number") return null;

  const classes = useStyles();
  const isPositiveDiff = value >= 0;

  return (
    <span className={className}>
      {value >= 0 ? "+" : null}
      <FormattedNumber value={value} maximumFractionDigits={2} />
    </span>
  );
};
