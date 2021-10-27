import React, { useEffect, useState } from "react";
import { ResponsiveLineCanvas } from "@nivo/line";
import { FormattedDate, FormattedNumber, useIntl } from "react-intl";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { useStyles } from "./Revenue.styles";
import { DailySpentGraph, DailySpentGraphResponse, GraphResponse, Snapshots, SnapshotsUrlParam, SnapshotValue } from "@src/shared/models";
import { Box, Button, ButtonGroup, CircularProgress, Typography } from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import clsx from "clsx";
import { useHistory, useLocation, useParams } from "react-router";
import { Helmet } from "react-helmet-async";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { urlParamToSnapshot } from "@src/shared/utils/snapshotsUrlHelpers";
import { useGraphSnapshot, useRevenueGraph } from "@src/queries/useGrapsQuery";
import { average, nFormatter, percIncrease, round, uaktToAKT } from "@src/shared/utils/mathHelpers";
import { DiffPercentageChip } from "@src/shared/components/DiffPercentageChip";
import { DiffNumber } from "@src/shared/components/DiffNumber";
import { SelectedRange } from "@src/shared/contants";

type RevenueVariant = "total" | "daily";

export interface IRevenueProps {}

export const Revenue: React.FunctionComponent<IRevenueProps> = ({}) => {
  const { variant } = useParams<{ variant: RevenueVariant }>();
  const [selectedRange, setSelectedRange] = useState(SelectedRange["7D"]);
  const { data: revenueGraphData, status } = useRevenueGraph();
  const mediaQuery = useMediaQueryContext();
  const classes = useStyles();
  const theme = getTheme();
  const intl = useIntl();
  const rangedData: DailySpentGraph[] =
    revenueGraphData && revenueGraphData.days.slice(revenueGraphData.days.length - selectedRange, revenueGraphData.days.length);
  const minValue = rangedData && rangedData.map((x) => uaktToAKT(variant === "total" ? x.totalUAkt : x.revenueUAkt)).reduce((a, b) => (a < b ? a : b));
  const maxValue = rangedData && rangedData.map((x) => uaktToAKT(variant === "total" ? x.totalUAkt : x.revenueUAkt)).reduce((a, b) => (a > b ? a : b));
  const graphData = rangedData
    ? [
        {
          id: variant,
          color: "rgb(1,0,0)",
          data: rangedData.map((dataPoint) => ({
            x: dataPoint.date,
            y: round(uaktToAKT(variant === "total" ? dataPoint.totalUAkt : dataPoint.revenueUAkt))
          }))
        }
      ]
    : null;
  const title = getTitle(variant);
  const graphMetadata = revenueGraphData && getGraphMetadata(variant, revenueGraphData);
  const graphMetadataPerRange = getGraphMetadataPerRange(selectedRange);

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

      {!revenueGraphData && status === "loading" && (
        <div className={classes.loading}>
          <CircularProgress size={80} />
        </div>
      )}

      {revenueGraphData && (
        <>
          <Box className={classes.subTitle}>
            <Box className={classes.subTitleValues}>
              <Typography variant="h3" className={classes.titleValue}>
                <FormattedNumber value={graphMetadata.value} maximumFractionDigits={2} />
                &nbsp;
                <DiffPercentageChip value={graphMetadata.diffPercent} size="medium" />
                &nbsp;
                <DiffNumber value={graphMetadata.diffNumber} className={classes.diffNumber} />
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
                tickValues: getTickValues(rangedData, graphMetadataPerRange.xModulo)
              }}
              // @ts-ignore will be fixed in 0.69.1
              axisLeft={{
                format: (val) => nFormatter(val, 2)
              }}
              axisTop={null}
              axisRight={null}
              colors={"#e41e13"}
              pointSize={graphMetadataPerRange.size}
              pointBorderColor="#e41e13"
              pointColor={"#ffffff"}
              pointBorderWidth={graphMetadataPerRange.border}
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

const getGraphMetadata = (
  variant: RevenueVariant,
  revenueGraphData: DailySpentGraphResponse
): { value?: number; diffNumber?: number; diffPercent?: number } => {
  const lastData = revenueGraphData.days[revenueGraphData.days.length - 1];
  const previousLastData = revenueGraphData.days[revenueGraphData.days.length - 2];
  switch (variant) {
    case "total":
      return {
        value: uaktToAKT(revenueGraphData.totalUAkt),
        diffPercent: percIncrease(previousLastData.totalUAkt, lastData.totalUAkt),
        diffNumber: uaktToAKT(lastData.totalUAkt - previousLastData.totalUAkt)
      };
    case "daily":
      return {
        value: revenueGraphData.last24.akt,
        diffPercent: percIncrease(previousLastData.revenueUAkt, lastData.revenueUAkt),
        diffNumber: uaktToAKT(lastData.revenueUAkt - previousLastData.revenueUAkt)
      };

    default:
      return { value: 0, diffNumber: 0, diffPercent: 0 };
  }
};

const getTitle = (variant: RevenueVariant): string => {
  switch (variant) {
    case "total":
      return "Total AKT spent";
    case "daily":
      return "Daily AKT spent";

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

const getTickValues = (rangedData: DailySpentGraph[], modulo: number) => {
  const values = rangedData.reverse().filter((data, i) => i % modulo === 0);
  const maxLength = 10;

  if (values.length > maxLength) {
    const mod = Math.round(rangedData.length / maxLength);
    return rangedData.filter((data, i) => i % mod === 0).map((data) => data.date);
  } else {
    return values.map((data) => data.date);
  }
};
