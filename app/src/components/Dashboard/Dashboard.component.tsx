import React from "react";
import clsx from "clsx";
import { useStyles } from "./Dashboard.styles";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import { Box, Button, Chip, Paper, Typography } from "@material-ui/core";
import { StatsCard } from "../StatsCard";
import { FormattedNumber } from "react-intl";
import { DashboardData, SnapshotsUrlParam } from "@src/shared/models";
import { Link as RouterLink } from "react-router-dom";
import { average, percIncrease, uaktToAKT } from "@src/shared/utils/mathHelpers";
import { DiffNumber } from "@src/shared/components/DiffNumber";
import { DiffPercentageChip } from "@src/shared/components/DiffPercentageChip";

interface IDashboardProps {
  dashboardData: DashboardData;
}

export const Dashboard: React.FunctionComponent<IDashboardProps> = ({ dashboardData }) => {
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();

  let tileClassName = "col-lg-3";

  return (
    <>
      <Paper className={classes.priceDataContainer} elevation={2}>
        <div className={classes.priceData}>
          AKT{" "}
          <div className={classes.priceDataValue}>
            <FormattedNumber style="currency" currency="USD" value={dashboardData.marketData.price} />
            <Box display="flex" alignItems="center" fontSize=".8rem" fontWeight={300}>
              <DiffPercentageChip value={dashboardData.marketData.priceChangePercentage24 / 100} />
              <Box component="span" ml=".5rem">
                (24h)
              </Box>
            </Box>
          </div>
        </div>
        <div className={classes.priceData}>
          <span>Market cap</span>{" "}
          <span className={classes.priceDataValue}>
            <FormattedNumber style="currency" currency="USD" value={dashboardData.marketData.marketCap} minimumFractionDigits={0} maximumFractionDigits={0} />
          </span>
        </div>
        <div className={classes.priceData}>
          <span>Volume (24h)</span>{" "}
          <span className={classes.priceDataValue}>
            <FormattedNumber style="currency" currency="USD" value={dashboardData.marketData.volume} minimumFractionDigits={0} maximumFractionDigits={0} />
          </span>
        </div>
        <div className={classes.priceData}>
          <span>Rank</span> <span className={classes.priceDataValue}>{dashboardData.marketData.marketCapRank}</span>
        </div>
      </Paper>

      <div
        className={clsx("row", {
          "mb-4": !mediaQuery.smallScreen,
          "mb-2 text-center": mediaQuery.smallScreen
        })}
      >
        <div className="col-xs-12">
          <Typography variant="h1" className={clsx(classes.title, { "text-center": mediaQuery.smallScreen })}>
            Network summary
          </Typography>
        </div>
      </div>

      <div className="row">
        <div className={clsx("col-xs-12", tileClassName)}>
          <StatsCard
            number={
              <>
                <FormattedNumber value={uaktToAKT(dashboardData.now.totalUAktSpent - dashboardData.compare.totalUAktSpent)} maximumFractionDigits={2} /> AKT
              </>
            }
            text="Daily AKT spent"
            tooltip="Last 24h"
            graphPath={`/revenue/daily`}
            diffNumber={0}
            diffPercent={0}
            //diffNumber={uaktToAKT(dashboardData.spentStats?.revenueLast24.uakt - dashboardData.spentStats?.revenuePrevious24.uakt)}
            //diffPercent={percIncrease(dashboardData.spentStats?.revenuePrevious24.uakt, dashboardData.spentStats?.revenueLast24.uakt)}
          />
        </div>

        <div className={clsx("col-xs-12", tileClassName)}>
          <StatsCard
            number={
              <>
                <FormattedNumber value={uaktToAKT(dashboardData.now.totalUAktSpent)} maximumFractionDigits={2} /> AKT
              </>
            }
            text="Total spent on decloud"
            tooltip="This is the total amount akt spent to rent computing power on the akash network since the beginning of the network. (March 2021)"
            graphPath={`/revenue/total`}
            diffNumber={uaktToAKT(dashboardData.now.totalUAktSpent - dashboardData.compare.totalUAktSpent)}
            diffPercent={percIncrease(dashboardData.compare.totalUAktSpent, dashboardData.now.totalUAktSpent)}
          />
        </div>

        <div className={clsx("col-xs-12", tileClassName)}>
          <StatsCard
            number={<FormattedNumber value={dashboardData.now.totalLeaseCount - dashboardData.compare.totalLeaseCount} />}
            text="Daily new deployment count"
            tooltip="Last 24h"
            graphPath={`/graph/${SnapshotsUrlParam.dailyDeploymentCount}`}
            diffNumber={dashboardData.now.totalLeaseCount - dashboardData.compare.totalLeaseCount}
            diffPercent={0}
            // diffPercent={percIncrease(dashboardData.lastSnapshot.dailyDeploymentCount, dashboardData.dailyDeploymentCount)}
          />
        </div>

        <div className={clsx("col-xs-12", tileClassName)}>
          <StatsCard
            number={<FormattedNumber value={dashboardData.now.totalLeaseCount} />}
            text="Total deployment count"
            tooltip="The total deployment count consists of all deployments that were live(leased) at some point and that someone paid for. This includes deployments that were deployed for testing or that were meant to be only temporary."
            graphPath={`/graph/${SnapshotsUrlParam.allTimeDeploymentCount}`}
            diffNumber={dashboardData.now.totalLeaseCount - dashboardData.compare.totalLeaseCount}
            diffPercent={percIncrease(dashboardData.compare.totalLeaseCount, dashboardData.now.totalLeaseCount)}
          />
        </div>
      </div>

      <div
        className={clsx("row mt-5", {
          "mb-4": !mediaQuery.smallScreen,
          "mb-2 text-center": mediaQuery.smallScreen
        })}
      >
        <div className="col-xs-12">
          <Typography variant="h1" className={clsx(classes.title, { "text-center": mediaQuery.smallScreen })}>
            Total resources currently leased
            {/* <Chip
                  size="small"
                  label="Live"
                  icon={<FiberManualRecordIcon />}
                  classes={{ root: classes.liveChip, icon: classes.liveChipIcon }}
                /> */}
          </Typography>
        </div>
      </div>
      <div className="row">
        <div className={clsx("col-xs-12 col-lg-3")}>
          <StatsCard
            number={<FormattedNumber value={dashboardData.now.activeLeaseCount} />}
            text="Active deployments"
            tooltip={
              <>
                <div>This is number of deployments currently active on the network. A deployment can be anything. </div>
                <div>For example: a simple website to a blockchain node or a video game server.</div>
              </>
            }
            graphPath={`/graph/${SnapshotsUrlParam.activeDeployment}`}
            diffNumber={dashboardData.now.activeLeaseCount - dashboardData.compare.activeLeaseCount}
            diffPercent={percIncrease(dashboardData.compare.activeLeaseCount, dashboardData.now.activeLeaseCount)}
          />
        </div>

        <div className={clsx("col-xs-12 col-lg-3")}>
          <StatsCard
            number={
              <>
                <FormattedNumber value={dashboardData.now.activeCPU / 1000} maximumFractionDigits={2} />
                <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>vCPUs</small>
              </>
            }
            text="Compute"
            graphPath={`/graph/${SnapshotsUrlParam.compute}`}
            diffNumber={(dashboardData.now.activeCPU - dashboardData.compare.activeCPU) / 1000}
            diffPercent={percIncrease(dashboardData.compare.activeCPU, dashboardData.now.activeCPU)}
          />
        </div>

        <div className={clsx("col-xs-12 col-lg-3")}>
          <StatsCard
            number={
              <>
                <FormattedNumber value={dashboardData.now.activeMemory / 1024 / 1024 / 1024} maximumFractionDigits={2} />
                <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>Gi</small>
              </>
            }
            text="Memory"
            graphPath={`/graph/${SnapshotsUrlParam.memory}`}
            diffNumber={(dashboardData.now.activeMemory - dashboardData.compare.activeMemory) / 1024 / 1024 / 1024}
            diffPercent={percIncrease(dashboardData.compare.activeMemory, dashboardData.now.activeMemory)}
          />
        </div>

        <div className={clsx("col-xs-12 col-lg-3")}>
          <StatsCard
            number={
              <>
                <FormattedNumber value={dashboardData.now.activeStorage / 1024 / 1024 / 1024} maximumFractionDigits={2} />
                <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>Gi</small>
              </>
            }
            text="Storage"
            graphPath={`/graph/${SnapshotsUrlParam.storage}`}
            diffNumber={(dashboardData.now.activeStorage - dashboardData.compare.activeStorage) / 1024 / 1024 / 1024}
            diffPercent={percIncrease(dashboardData.compare.activeStorage, dashboardData.compare.activeStorage)}
          />
        </div>
      </div>
    </>
  );
};
