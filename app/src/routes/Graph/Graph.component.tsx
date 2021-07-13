import React, { useEffect, useState } from "react";
import { ResponsiveLineCanvas } from "@nivo/line";
import { FormattedDate, FormattedNumber, useIntl } from "react-intl";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { useStyles } from "./Graph.styles";
import { GraphResponse, Snapshots, SnapshotsUrlParam, SnapshotValue } from "@src/shared/models";
import { Box, Button, ButtonGroup, CircularProgress, Typography } from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import clsx from "clsx";
import { useHistory, useLocation, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { urlParamToSnapshot } from "@src/shared/utils/snapshotsUrlHelpers";
import { useGraphSnapshot } from "@src/queries/useGrapsQuery";
import { average, percIncrease, round, uaktToAKT } from "@src/shared/utils/mathHelpers";
import { DiffPercentageChip } from "@src/shared/components/DiffPercentageChip";
import { DiffNumber } from "@src/shared/components/DiffNumber";

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
    snapshotData &&
    snapshotData.snapshots.slice(
      snapshotData.snapshots.length - selectedRange,
      snapshotData.snapshots.length
    );
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
            y: round(snapshot.average ? snapshot.average : snapshot.value),
          })),
        },
      ]
    : null;
  const title = getTitle(snapshot as Snapshots);
  const snapshotMetadata = snapshotData && getSnapshotMetadata(snapshot as Snapshots, snapshotData);
  const graphMetadata = getGraphMetadataPerRange(selectedRange);

  return (
    <div className={clsx("container", classes.root)}>
      <Helmet title={title} />

      <div>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
          Back
        </Button>
      </div>

      <div className={clsx("row mt-4 mb-2")}>
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
          <Box className={classes.subTitle}>
            <Box className={classes.subTitleValues}>
              <Typography variant="h3" className={classes.titleValue}>
                <FormattedNumber value={snapshotMetadata.value} maximumFractionDigits={2} />
                &nbsp;
                <DiffPercentageChip value={snapshotMetadata.diffPercent} size="medium" />
                &nbsp;
                <DiffNumber value={snapshotMetadata.diffNumber} className={classes.diffNumber} />
              </Typography>
            </Box>

            <ButtonGroup
              size="small"
              aria-label="Graph range select"
              className={classes.graphRangeSelect}
            >
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
                tickValues: getTickValues(rangedData, graphMetadata.xModulo),
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
                  <Typography variant="caption">
                    <FormattedDate
                      value={new Date(props.point.data.x)}
                      day="numeric"
                      month="long"
                      timeZone="UTC"
                    />
                  </Typography>
                  <Box>{props.point.data.y}</Box>
                </div>
              )}
              useMesh={true}
              enableGridX={false}
              enableCrosshair={true}
            />
          </div>

          {isAverage && (
            <div className="row">
              <div className="col-lg-12">
                <p className={clsx(classes.graphExplanation)}>
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

const getSnapshotMetadata = (
  snapshot: Snapshots,
  snapshotData: GraphResponse
): { value?: number; diffNumber?: number; diffPercent?: number } => {
  const lastSnapshot = snapshotData.snapshots[snapshotData.snapshots.length - 1];
  const previousLastSnapshot = snapshotData.snapshots[snapshotData.snapshots.length - 2];
  switch (snapshot) {
    case Snapshots.activeDeployment:
      return {
        value: snapshotData.currentValue,
        diffPercent: percIncrease(
          Math.ceil(average(lastSnapshot.min, lastSnapshot.max)),
          snapshotData.currentValue
        ),
        diffNumber:
          snapshotData.currentValue - Math.ceil(average(lastSnapshot.min, lastSnapshot.max)),
      };
    case Snapshots.totalAKTSpent:
      return {
        value: uaktToAKT(snapshotData.currentValue),
        diffPercent: percIncrease(lastSnapshot.value, uaktToAKT(snapshotData.currentValue)),
        diffNumber: uaktToAKT(snapshotData.currentValue) - lastSnapshot.value,
      };
    case Snapshots.dailyAktSpent:
      return {
        value: uaktToAKT(snapshotData.currentValue),
        diffPercent: percIncrease(previousLastSnapshot.value, uaktToAKT(snapshotData.currentValue)),
        diffNumber: uaktToAKT(snapshotData.currentValue) - previousLastSnapshot.value,
      };
    case Snapshots.allTimeDeploymentCount:
      return {
        value: snapshotData.currentValue,
        diffPercent: percIncrease(lastSnapshot.value, snapshotData.currentValue),
        diffNumber: snapshotData.currentValue - lastSnapshot.value,
      };
    case Snapshots.dailyDeploymentCount:
      return {
        value: snapshotData.currentValue,
        diffPercent: percIncrease(previousLastSnapshot.value, snapshotData.currentValue),
        diffNumber: snapshotData.currentValue - previousLastSnapshot.value,
      };
    case Snapshots.compute:
      return {
        value: snapshotData.currentValue / 1000,
        diffPercent: percIncrease(
          average(lastSnapshot.min, lastSnapshot.max),
          snapshotData.currentValue / 1000
        ),
        diffNumber: snapshotData.currentValue / 1000 - average(lastSnapshot.min, lastSnapshot.max),
      };
    case Snapshots.memory:
    case Snapshots.storage:
      return {
        value: snapshotData.currentValue / 1024 / 1024 / 1024,
        diffPercent: percIncrease(
          average(lastSnapshot.min, lastSnapshot.max),
          snapshotData.currentValue / 1024 / 1024 / 1024
        ),
        diffNumber:
          snapshotData.currentValue / 1024 / 1024 / 1024 -
          average(lastSnapshot.min, lastSnapshot.max),
      };

    default:
      return { value: 0, diffNumber: 0, diffPercent: 0 };
  }
};

const getTitle = (snapshot: Snapshots): string => {
  switch (snapshot) {
    case Snapshots.activeDeployment:
      return "Daily active deployments";
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
    case Snapshots.dailyAktSpent:
      return "Daily AKT spent";
    case Snapshots.dailyDeploymentCount:
      return "Daily deployment count";

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
        size: 3,
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

const getTickValues = (rangedData: SnapshotValue[], modulo: number) => {
  const values = rangedData.reverse().filter((data, i) => i % modulo === 0);
  const maxLength = 10;

  if (values.length > maxLength) {
    const mod = Math.round(rangedData.length / maxLength);
    return rangedData.filter((data, i) => i % mod === 0).map((data) => data.date);
  } else {
    return values.map((data) => data.date);
  }
};
