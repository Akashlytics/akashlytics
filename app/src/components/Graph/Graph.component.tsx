import React, { useEffect, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { FormattedDate } from "react-intl";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { useStyles } from "./Graph.styles";
import { Snapshots } from "@src/shared/models";

interface SnapshotValue {
  date: string;
  min?: number;
  max?: number;
  average?: number;
  value?: number;
}

export interface IGraphProps {
  snapshot: Snapshots;
}

export const Graph: React.FunctionComponent<IGraphProps> = ({ snapshot }) => {
  const [snapshotData, setSnapshotData] = useState<Array<SnapshotValue>>(null);
  const mediaQuery = useMediaQueryContext();
  const classes = useStyles();
  const theme = getTheme();
  const maxValue =
    snapshotData && snapshotData.map((x) => x.max || x.value).reduce((a, b) => (a > b ? a : b));
  const graphData = snapshotData
    ? [
        {
          id: "activeDeploymentCount",
          color: "rgb(1,0,0)",
          data: snapshotData.map((snapshot) => ({
            x: snapshot.date,
            y: snapshot.average ? snapshot.average : snapshot.value,
          })),
        },
      ]
    : null;

  useEffect(() => {
    async function getSnapshotData() {
      try {
        const res = await fetch(`/api/getSnapshot/${snapshot}`);
        const data = await res.json();

        if (data) {
          setSnapshotData(data);
        }
      } catch (error) {
        console.log(error);
      }
    }

    getSnapshotData();
  }, []);

  return (
    // <> deploymentCounts.snapshots && deploymentCounts.snapshots.length > 0 &&
    //             <div
    //               className={clsx("row mt-5", {
    //                 "mb-4": !mediaQuery.smallScreen,
    //                 "mb-2 text-center": mediaQuery.smallScreen,
    //               })}
    //             >
    //               <div className="col-xs-12">
    //                 <Typography
    //                   variant="h1"
    //                   className={clsx(dashboardClasses.title, {
    //                     "text-center": mediaQuery.smallScreen,
    //                   })}
    //                 >
    //                   Average number of daily active deployments
    //                 </Typography>
    //               </div>
    //             </div>
    //             <div className="row justify-content-md-center">
    //               <div className="col-lg-12">
    //                 <ActiveDeploymentCountGraph data={deploymentCounts.snapshots} />
    //               </div>
    //             </div>
    //             <div className="row">
    //               <div className="col-lg-12">
    //                 <p className={clsx("text-white", classes.graphExplanation)}>
    //                   * The data points represent the average between the minimum and maximum active
    //                   deployment count for the day.
    //                 </p>
    //               </div>
    //             </div>
    //           </>
    <div className={classes.root}>
      {snapshotData && (
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
    case Snapshots.activeDeployment:
      return "Average number of daily active deployments";
    case Snapshots.activeDeployment:
      return "Average number of daily active deployments";
    case Snapshots.activeDeployment:
      return "Average number of daily active deployments";
    case Snapshots.activeDeployment:
      return "Average number of daily active deployments";

    default:
      return "";
  }
};
