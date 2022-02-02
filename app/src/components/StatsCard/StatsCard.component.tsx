import React from "react";
import clsx from "clsx";
import { useStyles } from "./StatsCard.styles";
import { Tooltip, withStyles, Card, CardHeader, CardActions, Button, Box } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import TimelineIcon from "@material-ui/icons/Timeline";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import { DiffPercentageChip } from "@src/shared/components/DiffPercentageChip";
import { DiffNumber } from "@src/shared/components/DiffNumber";

interface IStatsCardProps {
  number: React.ReactNode;
  text: string;
  diffNumber?: number;
  diffPercent?: number;
  tooltip?: string | React.ReactNode;
  graphPath?: string;
  actionButton?: string | React.ReactNode;
}

const CustomTooltip = withStyles((theme) => ({
  tooltip: {
    maxWidth: 300,
    fontSize: "1rem",
    borderRadius: ".5rem",
    fontWeight: "normal",
  },
}))(Tooltip);

export function StatsCard({
  number,
  text,
  tooltip,
  actionButton,
  graphPath,
  diffNumber,
  diffPercent,
}: IStatsCardProps) {
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();

  return (
    <Card
      className={clsx(classes.root, { [classes.rootSmall]: mediaQuery.smallScreen })}
      elevation={3}
    >
      <CardHeader
        classes={{ title: classes.number, root: classes.cardHeader, subheader: classes.subHeader }}
        title={number}
        subheader={diffNumber && (
          <>
            <DiffNumber value={diffNumber} />
            &nbsp;
            <DiffPercentageChip value={diffPercent} />
          </>
        )}
      />
      <div className={classes.cardContent}>
        <p className={classes.title}>{text}</p>
      </div>

      <CardActions>
        {tooltip && (
          <CustomTooltip arrow enterTouchDelay={0} leaveTouchDelay={10000} title={tooltip}>
            <HelpIcon className={classes.tooltip} />
          </CustomTooltip>
        )}
        {graphPath && (
          <Button
            aria-label="graph"
            component={RouterLink}
            to={graphPath}
            size="small"
            classes={{ label: classes.actionButtonLabel }}
          >
            <Box component="span" marginRight=".5rem">
              Graph
            </Box>
            <TimelineIcon className={classes.actionIcon} />
          </Button>
        )}

        {actionButton}
      </CardActions>
    </Card>
  );
}
