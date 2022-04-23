import React, { useState } from "react";
import { ResponsiveLineCanvas } from "@nivo/line";
import { FormattedDate, FormattedNumber, useIntl } from "react-intl";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { useStyles } from "./Graph.styles";
import { GraphResponse, Snapshots, SnapshotsUrlParam, SnapshotValue } from "@src/shared/models";
import { Box, Button, ButtonGroup, CircularProgress, Typography } from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import clsx from "clsx";
import { useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import { Link as RouterLink } from "react-router-dom";
import { urlParamToSnapshot } from "@src/shared/utils/snapshotsUrlHelpers";
import { useGraphSnapshot } from "@src/queries/useGrapsQuery";
import { nFormatter, percIncrease, round, uaktToAKT } from "@src/shared/utils/mathHelpers";
import { DiffPercentageChip } from "@src/shared/components/DiffPercentageChip";
import { DiffNumber } from "@src/shared/components/DiffNumber";
import { SelectedRange } from "@src/shared/constants";

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

  const title = getTitle(snapshot as Snapshots);
  const snapshotMetadata = snapshotData && getSnapshotMetadata(snapshot as Snapshots, snapshotData);
  const rangedData = snapshotData && snapshotData.snapshots.slice(snapshotData.snapshots.length - selectedRange, snapshotData.snapshots.length);
  const minValue = rangedData && snapshotMetadata.unitFn(rangedData.map((x) => x.value).reduce((a, b) => (a < b ? a : b)));
  const maxValue = snapshotData && snapshotMetadata.unitFn(rangedData.map((x) => x.value).reduce((a, b) => (a > b ? a : b)));
  const graphData = snapshotData
    ? [
        {
          id: snapshot,
          color: "rgb(1,0,0)",
          data: rangedData.map((snapshot) => ({
            x: snapshot.date,
            y: round(snapshotMetadata.unitFn(snapshot.value))
          }))
        }
      ]
    : null;
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
                <FormattedNumber value={snapshotMetadata.unitFn(snapshotData.currentValue)} maximumFractionDigits={2} />
                &nbsp;
                <DiffPercentageChip value={percIncrease(snapshotData.compareValue, snapshotData.currentValue)} size="medium" />
                &nbsp;
                <DiffNumber value={snapshotMetadata.unitFn(snapshotData.currentValue - snapshotData.compareValue)} className={classes.diffNumber} />
              </Typography>
            </Box>

            <ButtonGroup size="small" aria-label="Graph range select" className={classes.graphRangeSelect}>
              <Button variant={selectedRange === SelectedRange["7D"] ? "contained" : "outlined"} onClick={() => setSelectedRange(SelectedRange["7D"])}>
                7D
              </Button>
              <Button variant={selectedRange === SelectedRange["1M"] ? "contained" : "outlined"} onClick={() => setSelectedRange(SelectedRange["1M"])}>
                1M
              </Button>
              <Button variant={selectedRange === SelectedRange["ALL"] ? "contained" : "outlined"} onClick={() => setSelectedRange(SelectedRange["ALL"])}>
                ALL
              </Button>
            </ButtonGroup>
          </Box>

          <div className={classes.graphContainer}>
            <Box className={classes.watermark}>
              <Typography variant="caption">akashlytics.com</Typography>
            </Box>
            <ResponsiveLineCanvas
              theme={theme}
              data={graphData}
              curve="linear"
              margin={{ top: 30, right: 35, bottom: 50, left: 45 }}
              xScale={{ type: "point" }}
              yScale={{
                type: "linear",
                min: minValue * 0.98,
                max: maxValue * 1.02
              }}
              yFormat=" >-1d"
              // @ts-ignore will be fixed in 0.69.1
              axisBottom={{
                tickRotation: mediaQuery.mobileView ? 45 : 0,
                format: (dateStr) => intl.formatDate(dateStr, { day: "numeric", month: "short", timeZone: "utc" }),
                tickValues: getTickValues(rangedData, graphMetadata.xModulo)
              }}
              // @ts-ignore will be fixed in 0.69.1
              axisLeft={{
                format: (val) => nFormatter(val, 2)
              }}
              axisTop={null}
              axisRight={null}
              colors={"#e41e13"}
              pointSize={graphMetadata.size}
              pointBorderColor="#e41e13"
              pointColor={"#ffffff"}
              pointBorderWidth={graphMetadata.border}
              isInteractive={true}
              tooltip={(props) => (
                <div className={classes.graphTooltip}>
                  <Typography variant="caption">
                    <FormattedDate value={new Date(props.point.data.x)} day="numeric" month="long" timeZone="UTC" />
                  </Typography>
                  <Box>{nFormatter(props.point.data.y as number, 2)}</Box>
                </div>
              )}
              enableGridX={false}
              enableCrosshair={true}
            />
          </div>
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
          strokeWidth: 1
        }
      },
      ticks: {
        line: {
          stroke: "#FFFFFF",
          strokeWidth: 1
        }
      }
    },
    grid: {
      line: {
        stroke: "#FFFFFF",
        strokeWidth: 0.5
      }
    }
  };
};

const getSnapshotMetadata = (snapshot: Snapshots, snapshotData: GraphResponse): { unitFn: (number) => number } => {
  switch (snapshot) {
    case Snapshots.dailyUAktSpent:
    case Snapshots.totalUAktSpent:
      return { unitFn: (x) => uaktToAKT(x) };
    case Snapshots.activeCPU:
      return {
        unitFn: (x) => x / 1000
      };
    case Snapshots.activeMemory:
    case Snapshots.activeStorage:
      return {
        unitFn: (x) => x / 1024 / 1024 / 1024
      };

    default:
      return {
        unitFn: (x) => x
      };
  }
};

const getTitle = (snapshot: Snapshots): string => {
  switch (snapshot) {
    case Snapshots.activeLeaseCount:
      return "Active leases";
    case Snapshots.totalUAktSpent:
      return "Total AKT spent";
    case Snapshots.totalLeaseCount:
      return "All-time lease count";
    case Snapshots.activeCPU:
      return "Number of vCPUs currently leased";
    case Snapshots.activeMemory:
      return "Number of GB of memory currently leased";
    case Snapshots.activeStorage:
      return "Number of GB of disk currently leased";
    case Snapshots.dailyUAktSpent:
      return "Daily AKT spent";
    case Snapshots.dailyLeaseCount:
      return "Daily new leases";

    default:
      return "Graph not found.";
  }
};

const getGraphMetadataPerRange = (range: SelectedRange): { size: number; border: number; xModulo: number } => {
  switch (range) {
    case SelectedRange["7D"]:
      return {
        size: 10,
        border: 3,
        xModulo: 1
      };
    case SelectedRange["1M"]:
      return {
        size: 6,
        border: 2,
        xModulo: 3
      };
    case SelectedRange["ALL"]:
      return {
        size: 3,
        border: 1,
        xModulo: 5
      };

    default:
      return {
        size: 10,
        border: 3,
        xModulo: 1
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
