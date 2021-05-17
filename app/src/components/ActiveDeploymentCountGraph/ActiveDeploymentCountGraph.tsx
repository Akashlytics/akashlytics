import React from "react";
import { ResponsiveLine } from "@nivo/line";
import { FormattedDate } from "react-intl";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "400px",
    maxWidth: "800px",
    margin: "auto",
  },
}));

export function ActiveDeploymentCountGraph(props) {
  const mediaQuery = useMediaQueryContext();
  const classes = useStyles();

  const graphData = props.data
    ? [
        {
          id: "activeDeploymentCount",
          color: "rgb(1,0,0)",
          data: props.data.map((snapshot) => ({
            x: snapshot.date,
            y: snapshot.average,
          })),
        },
      ]
    : null;

  const theme = {
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

  const maxValue = props.data && props.data.map((x) => x.max).reduce((a, b) => (a > b ? a : b));

  return (
    <div className={classes.root}>
      {props.data && (
        <ResponsiveLine
          theme={theme}
          data={graphData}
          curve="linear"
          margin={{ top: 30, right: 30, bottom: 50, left: 30 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: 0, max: maxValue + 5 }}
          yFormat=" >-1d"
          // @ts-ignore will be fixed in 0.69.1
          axisBottom={{
            tickRotation: mediaQuery.mobileView ? 45 : 0,
            format: (dateStr) => (
              <FormattedDate value={new Date(dateStr)} day="numeric" month="long" timeZone="UTC" />
            ),
          }}
          axisTop={null}
          axisRight={null}
          colors={"#e41e13"}
          pointSize={15}
          pointBorderColor="#e41e13"
          pointColor={"#ffffff"}
          pointBorderWidth={3}
          pointLabelYOffset={-15}
          enablePointLabel={false}
          isInteractive={true}
          tooltip={(props) => <div className="graphTooltip">{props.point.data.y}</div>}
          useMesh={true}
          enableCrosshair={false}
        />
      )}
    </div>
  );
}
