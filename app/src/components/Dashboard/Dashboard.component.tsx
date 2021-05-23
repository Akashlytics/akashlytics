import React from "react";
import clsx from "clsx";
import { useStyles } from "./Dashboard.styles";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import { Typography } from "@material-ui/core";
import { StatsCard } from "../StatsCard";
import { FormattedNumber } from "react-intl";
import { DashboardData, SnapshotsUrlParam } from "@src/shared/models";

interface IDashboardProps {
  deploymentCounts: DashboardData;
}

export const Dashboard: React.FunctionComponent<IDashboardProps> = ({ deploymentCounts }) => {
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();
  const showAktPrice = deploymentCounts && deploymentCounts.marketData;
  const showAveragePrice =
    deploymentCounts && deploymentCounts.marketData && deploymentCounts.averagePrice > 0;

  let tileClassName = "col-lg-6";
  if (showAktPrice) {
    tileClassName = "col-lg-4";
  }
  if (showAveragePrice) {
    tileClassName = "col-lg-3";
  }

  return (
    <>
      <div
        className={clsx("row", {
          "mb-4": !mediaQuery.smallScreen,
          "mb-2 text-center": mediaQuery.smallScreen,
        })}
      >
        <div className="col-xs-12">
          <Typography
            variant="h1"
            className={clsx(classes.title, { "text-center": mediaQuery.smallScreen })}
          >
            Network summary
          </Typography>
        </div>
      </div>

      <div className="row">
        {deploymentCounts.marketData && (
          <div className={clsx("col-xs-12", tileClassName)}>
            <StatsCard
              number={
                <FormattedNumber
                  style="currency"
                  currency="USD"
                  value={deploymentCounts.marketData.computedPrice}
                />
              }
              text="Current AKT Price"
            />
          </div>
        )}

        {showAveragePrice && (
          <div className={clsx("col-xs-12", tileClassName)}>
            <StatsCard
              number={
                <FormattedNumber
                  style="currency"
                  currency="USD"
                  value={0.432 * deploymentCounts.marketData.computedPrice}
                />
              }
              text="Monthly cost for a small instance"
              extraText="0.432akt/month"
              tooltip={
                <>
                  <div style={{ fontWeight: "lighter" }}>Based on these specs:</div>
                  <div>CPU: 0.1</div>
                  <div>RAM: 512Mi</div>
                  <div>DISK: 512Mi</div>
                </>
              }
            />
          </div>
        )}

        <div className={clsx("col-xs-12", tileClassName)}>
          <StatsCard
            number={
              <>
                <FormattedNumber
                  value={deploymentCounts.totalAKTSpent / 1000000}
                  maximumFractionDigits={0}
                />{" "}
                akt
              </>
            }
            text="Total spent on decloud"
            tooltip="This is the total amount akt spent to rent computing power on the akash network since the beginning of the network. (March 2021)"
            graphPath={`/graph/${SnapshotsUrlParam.totalAKTSpent}`}
          />
        </div>

        <div className={clsx("col-xs-12", tileClassName)}>
          <StatsCard
            number={<FormattedNumber value={deploymentCounts.deploymentCount} />}
            text="All-time deployment count"
            tooltip="The all-time deployment count consists of all deployments that were live at some point. This includes deployments that were deployed for testing or that were meant to be only temporary."
            graphPath={`/graph/${SnapshotsUrlParam.allTimeDeploymentCount}`}
          />
        </div>
      </div>

      {deploymentCounts.totalResourcesLeased && (
        <>
          <div
            className={clsx("row mt-5", {
              "mb-4": !mediaQuery.smallScreen,
              "mb-2 text-center": mediaQuery.smallScreen,
            })}
          >
            <div className="col-xs-12">
              <Typography
                variant="h1"
                className={clsx(classes.title, { "text-center": mediaQuery.smallScreen })}
              >
                Total resources currently leased
              </Typography>
            </div>
          </div>
          <div className="row">
            {deploymentCounts.activeDeploymentCount && (
              <div className={clsx("col-xs-12 col-lg-3")}>
                <StatsCard
                  number={<FormattedNumber value={deploymentCounts.activeDeploymentCount} />}
                  text="Active deployments"
                  tooltip={
                    <>
                      <div>
                        This is number of deployments currently active on the network. A deployment
                        can be anything.{" "}
                      </div>
                      <div>
                        For example: a simple website to a blockchain node or a video game server.
                      </div>
                    </>
                  }
                  graphPath={`/graph/${SnapshotsUrlParam.activeDeployment}`}
                />
              </div>
            )}

            <div className={clsx("col-xs-12 col-lg-3")}>
              <StatsCard
                number={
                  <>
                    <FormattedNumber value={deploymentCounts.totalResourcesLeased.cpuSum / 1000} />
                    <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>
                      vCPUs
                    </small>
                  </>
                }
                text="Compute"
                graphPath={`/graph/${SnapshotsUrlParam.compute}`}
              />
            </div>

            <div className={clsx("col-xs-12 col-lg-3")}>
              <StatsCard
                number={
                  <>
                    <FormattedNumber
                      value={deploymentCounts.totalResourcesLeased.memorySum / 1024 / 1024 / 1024}
                    />
                    <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>
                      Gi
                    </small>
                  </>
                }
                text="Memory"
                graphPath={`/graph/${SnapshotsUrlParam.memory}`}
              />
            </div>

            <div className={clsx("col-xs-12 col-lg-3")}>
              <StatsCard
                number={
                  <>
                    <FormattedNumber
                      value={deploymentCounts.totalResourcesLeased.storageSum / 1024 / 1024 / 1024}
                    />
                    <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>
                      Gi
                    </small>
                  </>
                }
                text="Storage"
                graphPath={`/graph/${SnapshotsUrlParam.storage}`}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};
