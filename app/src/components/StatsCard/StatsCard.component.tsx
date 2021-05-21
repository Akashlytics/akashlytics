import React from "react";
import clsx from "clsx";
import { useStyles } from "./StatsCard.styles";
import { Tooltip } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";

interface IStatsCardProps {
  number: React.ReactNode;
  text: string;
  extraText?: string;
  tooltip?: string | React.ReactNode;
  onClick?: () => void;
}

export function StatsCard({ number, text, tooltip, extraText, onClick }: IStatsCardProps) {
  const classes = useStyles();

  return (
    <div className={classes.root} onClick={onClick}>
      <p className={classes.number}>{number}</p>
      <p className={classes.text}>{text}</p>
      <small className={classes.extraText}>{extraText}</small>

      {tooltip && (
        <Tooltip
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={10000}
          classes={{ tooltip: classes.tooltip }}
          title={tooltip}
        >
          <HelpIcon className={classes.tooltipIcon} />
        </Tooltip>
      )}
    </div>
  );
}
