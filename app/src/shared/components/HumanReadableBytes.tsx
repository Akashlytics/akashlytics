import React from "react";
import { makeStyles } from "@material-ui/core";
import { FormattedNumber } from "react-intl";

export interface HumanReadableBytesProps {
  value: number;
}

export const HumanReadableBytes: React.FunctionComponent<HumanReadableBytesProps> = ({ value }) => {
  if (typeof value !== "number") return null;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  let finalValue = 0;
  let finalUnit = sizes[0];

  if (value !== 0) {
    const i = parseInt(Math.floor(Math.log(value) / Math.log(1024)).toString());

    if (i !== 0) {
      finalValue = value / Math.pow(1024, i);
      finalUnit = sizes[i];
    }
  }

  return (
    <>
      <FormattedNumber value={finalValue} maximumFractionDigits={1} />
      <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>{finalUnit}</small>
    </>
  );
};
