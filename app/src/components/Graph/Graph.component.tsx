import React, { useEffect, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { FormattedDate } from "react-intl";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { useStyles } from "./Graph.styles";
import { Snapshots, SnapshotsUrlParam } from "@src/shared/models";
import { Button, CircularProgress, Typography } from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import clsx from "clsx";
import { useHistory, useLocation, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { urlParamToSnapshot } from "@src/shared/utils/snapshotsUrlHelpers";
import { useGraphSnapshot } from "@src/hooks/queries/useGrapsQuery";

export interface IGraphProps {}

export const Graph: React.FunctionComponent<IGraphProps> = ({}) => {
  const { snapshot: snapshotUrlParam } = useParams<{ snapshot: string }>();
  const snapshot = urlParamToSnapshot(snapshotUrlParam as SnapshotsUrlParam);
  const { data: snapshotData, status } = useGraphSnapshot(snapshot);
  const mediaQuery = useMediaQueryContext();
  const classes = useStyles();
  const theme = getTheme();
  const maxValue =
    snapshotData && snapshotData.map((x) => x.max || x.value).reduce((a, b) => (a > b ? a : b));
  const isAverage = snapshotData && snapshotData.some((x) => x.average);
  const graphData = snapshotData
    ? [
        {
          id: snapshot,
          color: "rgb(1,0,0)",
          data: snapshotData.map((snapshot) => ({
            x: snapshot.date,
            y:
              Math.round(
                ((snapshot.average ? snapshot.average : snapshot.value) + Number.EPSILON) * 100
              ) / 100,
          })),
        },
      ]
    : null;
  const title = getTitle(snapshot as Snapshots);

  return (
    <div className={clsx("container", classes.root)}>
      <Helmet title={title} />

      <div>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
      </div>

      <div className={clsx("row mt-4 mb-3")}>
        <div className="col-xs-12">
          <Typography variant="h1" className={clsx(classes.title)}>
            {title}
          </Typography>
        </div>
      </div>

      {!snapshotData && status === "loading" && (
        <div className={classes.loading}>
          <CircularProgress size={80} />
        </div>
      )}

      {snapshotData && (
        <>
          <div className={classes.graphContainer}>
            <ResponsiveLine
              theme={theme}
              data={graphData}
              curve="linear"
              margin={{ top: 30, right: 30, bottom: 50, left: 45 }}
              xScale={{ type: "point" }}
              yScale={{
                type: "linear",
                min: Math.max(Math.min(...snapshotData.map((s) => s.min || s.value)) * 0.9, 0),
                max: maxValue * 1.05,
              }}
              yFormat=" >-1d"
              // @ts-ignore will be fixed in 0.69.1
              axisBottom={{
                tickRotation: mediaQuery.mobileView ? 45 : 0,
                format: (dateStr) => (
                  <FormattedDate
                    value={new Date(dateStr)}
                    day="numeric"
                    month="long"
                    timeZone="UTC"
                  />
                ),
              }}
              axisTop={null}
              axisRight={null}
              colors={"#e41e13"}
              pointSize={10}
              pointBorderColor="#e41e13"
              pointColor={"#ffffff"}
              pointBorderWidth={3}
              pointLabelYOffset={-15}
              enablePointLabel={false}
              isInteractive={true}
              tooltip={(props) => <div className={classes.graphTooltip}>{props.point.data.y}</div>}
              useMesh={true}
              enableCrosshair={false}
            />
          </div>

          {isAverage && (
            <div className="row">
              <div className="col-lg-12">
                <p className={clsx("text-white", classes.graphExplanation)}>
                  * The data points represent the average between the minimum and maximum value for
                  the day.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const getTheme = () => {
  return {
    textColor: "#FFFFFF",
    fontSize: 14,
    axis: {
      domain: {
        line: {
          stroke: "#FFFFFF",
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: "#FFFFFF",
          strokeWidth: 1,
        },
      },
    },
    grid: {
      line: {
        stroke: "#FFFFFF",
        strokeWidth: 0.5,
      },
    },
  };
};

const getTitle = (snapshot: Snapshots) => {
  switch (snapshot) {
    case Snapshots.activeDeployment:
      return "Average number of daily active deployments";
    case Snapshots.totalAKTSpent:
      return "Total AKT spent";
    case Snapshots.allTimeDeploymentCount:
      return "All-time deployment count";
    case Snapshots.compute:
      return "Number of vCPUs currently leased";
    case Snapshots.memory:
      return "Number of Gi of memory currently leased";
    case Snapshots.storage:
      return "Number of Gi of disk currently leased";

    default:
      return "Graph not found.";
  }
};
