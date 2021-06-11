import React from "react";
import clsx from "clsx";
import { useStyles } from "./StatsCard.styles";
import { IconButton, Tooltip, withStyles } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import TimelineIcon from "@material-ui/icons/Timeline";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";

interface IStatsCardProps {
  number: React.ReactNode;
  text: string;
  extraText?: string | React.ReactNode;
  tooltip?: string | React.ReactNode;
  graphPath?: string;
}

const CustomTooltip = withStyles((theme) => ({
  tooltip: {
    maxWidth: 300,
    fontSize: "1rem",
    borderRadius: ".5rem",
    fontWeight: "normal",
  },
}))(Tooltip);

export function StatsCard({ number, text, tooltip, extraText, graphPath }: IStatsCardProps) {
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();

  return (
    <div className={clsx(classes.root, { [classes.rootSmall]: mediaQuery.smallScreen })}>
      <p className={classes.number}>{number}</p>
      <p className={classes.text}>{text}</p>
      <small className={classes.extraText}>{extraText}</small>

      {tooltip && (
        <CustomTooltip arrow enterTouchDelay={0} leaveTouchDelay={10000} title={tooltip}>
          <HelpIcon className={classes.tooltipIcon} />
        </CustomTooltip>
      )}

      {graphPath && (
        <IconButton
          aria-label="delete"
          component={RouterLink}
          to={graphPath}
          className={classes.graph}
        >
          <TimelineIcon />
        </IconButton>
      )}
    </div>
  );
}
