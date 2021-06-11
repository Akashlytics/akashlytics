import React, { useEffect, useState } from "react";
import { ResponsiveLineCanvas } from "@nivo/line";
import { FormattedDate, useIntl } from "react-intl";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { useStyles } from "./Graph.styles";
import { Snapshots, SnapshotsUrlParam } from "@src/shared/models";
import { Box, Button, ButtonGroup, CircularProgress, Typography } from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import clsx from "clsx";
import { useHistory, useLocation, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { urlParamToSnapshot } from "@src/shared/utils/snapshotsUrlHelpers";
import { useGraphSnapshot } from "@src/hooks/queries/useGrapsQuery";

enum SelectedRange {
  "7D" = 7,
  "1M" = 30,
  "ALL" = Number.MAX_SAFE_INTEGER,
}

export interface IGraphProps {}

export const Graph: React.FunctionComponent<IGraphProps> = ({}) => {
  const [selectedRange, setSelectedRange] = useState(SelectedRange["7D"]);
  const { snapshot: snapshotUrlParam } = useParams<{ snapshot: string }>();
  const snapshot = urlParamToSnapshot(snapshotUrlParam as SnapshotsUrlParam);
  const { data: snapshotData, status } = useGraphSnapshot(snapshot);
  const mediaQuery = useMediaQueryContext();
  const classes = useStyles();
  const theme = getTheme();
  const intl = useIntl();
  const rangedData =
    snapshotData && snapshotData.slice(snapshotData.length - selectedRange, snapshotData.length);
  const minValue =
    rangedData && rangedData.map((x) => x.min || x.value).reduce((a, b) => (a < b ? a : b));
  const maxValue =
    snapshotData && rangedData.map((x) => x.max || x.value).reduce((a, b) => (a > b ? a : b));
  const isAverage = snapshotData && rangedData.some((x) => x.average);
  const graphData = snapshotData
    ? [
        {
          id: snapshot,
          color: "rgb(1,0,0)",
          data: rangedData.map((snapshot) => ({
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
  const graphMetadata = getGraphMetadataPerRange(selectedRange);

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
          <Box>
            <ButtonGroup size="small" aria-label="small outlined button group">
              <Button
                variant={selectedRange === SelectedRange["7D"] ? "contained" : "outlined"}
                onClick={() => setSelectedRange(SelectedRange["7D"])}
              >
                7D
              </Button>
              <Button
                variant={selectedRange === SelectedRange["1M"] ? "contained" : "outlined"}
                onClick={() => setSelectedRange(SelectedRange["1M"])}
              >
                1M
              </Button>
              <Button
                variant={selectedRange === SelectedRange["ALL"] ? "contained" : "outlined"}
                onClick={() => setSelectedRange(SelectedRange["ALL"])}
              >
                ALL
              </Button>
            </ButtonGroup>
          </Box>

          <div className={classes.graphContainer}>
            <ResponsiveLineCanvas
              theme={theme}
              data={graphData}
              curve="linear"
              margin={{ top: 30, right: 30, bottom: 50, left: 45 }}
              xScale={{ type: "point" }}
              yScale={{
                type: "linear",
                min: minValue * 0.98,
                max: maxValue * 1.02,
              }}
              yFormat=" >-1d"
              // @ts-ignore will be fixed in 0.69.1
              axisBottom={{
                tickRotation: mediaQuery.mobileView ? 45 : 0,
                format: (dateStr) =>
                  intl.formatDate(dateStr, { day: "numeric", month: "long", timeZone: "utc" }),
                tickValues: rangedData
                  .filter((data, i) => i % graphMetadata.xModulo === 0)
                  .map((data) => data.date),
              }}
              axisTop={null}
              axisRight={null}
              colors={"#e41e13"}
              pointSize={graphMetadata.size}
              pointBorderColor="#e41e13"
              pointColor={"#ffffff"}
              pointBorderWidth={graphMetadata.border}
              pointLabelYOffset={-15}
              enablePointLabel={false}
              isInteractive={true}
              tooltip={(props) => (
                <div className={classes.graphTooltip}>
                  {props.point.data.y}&nbsp;on&nbsp;
                  <FormattedDate
                    value={new Date(props.point.data.x)}
                    day="numeric"
                    month="long"
                    timeZone="UTC"
                  />
                </div>
              )}
              useMesh={true}
              enableGridX={false}
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

const getGraphMetadataPerRange = (
  range: SelectedRange
): { size: number; border: number; xModulo: number } => {
  switch (range) {
    case SelectedRange["7D"]:
      return {
        size: 10,
        border: 3,
        xModulo: 1,
      };
    case SelectedRange["1M"]:
      return {
        size: 6,
        border: 2,
        xModulo: 3,
      };
    case SelectedRange["ALL"]:
      return {
        size: 5,
        border: 1,
        xModulo: 5,
      };

    default:
      return {
        size: 10,
        border: 3,
        xModulo: 1,
      };
  }
};
