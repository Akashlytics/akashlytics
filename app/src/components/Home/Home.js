import React from "react";
import clsx from "clsx";
import { FormattedNumber } from "react-intl";
import { makeStyles } from "@material-ui/core/styles";
import { CircularProgress, Typography, Tooltip } from "@material-ui/core";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { ActiveDeploymentCountGraph } from "../ActiveDeploymentCountGraph";
import { Helmet } from "react-helmet-async";

const useStyles = makeStyles((theme) => ({
  title: {
    color: "white",
    fontWeight: "lighter",
    fontSize: "2rem",
    paddingBottom: "1rem",
    textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  monthlyAkt: {
    fontWeight: "bold",
    fontSize: 12,
    display: "block",
    marginTop: "-10px",
  },
  tooltipIcon: {
    position: "absolute",
    top: 5,
    right: 10,
    fontSize: "1.2rem",
  },
  tooltip: {
    maxWidth: 300,
    fontSize: "1rem",
    borderRadius: ".5rem",
    fontWeight: "normal",
  },
  graphExplanation: {
    fontSize: ".8rem",
    paddingTop: "1rem",
    fontStyle: "italic",
    fontSize: "1.1rem",
  },
}));

export function Home({ deploymentCounts }) {
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
      <Helmet title="Dashboard" />
      <div className="container App-body">
        {deploymentCounts !== null ? (
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
                  <div className="Card">
                    <p className="Number">
                      <FormattedNumber
                        style="currency"
                        currency="USD"
                        value={deploymentCounts.marketData.computedPrice}
                      />
                    </p>
                    <p className="Text">Current AKT Price</p>
                  </div>
                </div>
              )}

              {showAveragePrice && (
                <div className={clsx("col-xs-12", tileClassName)}>
                  <div className="Card">
                    <p className="Number">
                      <FormattedNumber
                        style="currency"
                        currency="USD"
                        value={0.432 * deploymentCounts.marketData.computedPrice}
                      />
                    </p>

                    <p className="Text">Monthly cost for a small instance</p>

                    <small className={classes.monthlyAkt}>0.432akt/month</small>

                    <Tooltip
                      arrow
                      enterTouchDelay={0}
                      leaveTouchDelay={10000}
                      classes={{ tooltip: classes.tooltip }}
                      title={
                        <>
                          <div style={{ fontWeight: "lighter" }}>Based on these specs:</div>
                          <div>CPU: 0.1</div>
                          <div>RAM: 512Mi</div>
                          <div>DISK: 512Mi</div>
                        </>
                      }
                    >
                      <i className={clsx("bi bi-question-circle-fill", classes.tooltipIcon)} />
                    </Tooltip>
                  </div>
                </div>
              )}

              <div className={clsx("col-xs-12", tileClassName)}>
                <div className="Card">
                  <p className="Number">
                    <FormattedNumber
                      value={deploymentCounts.totalAKTSpent / 1000000}
                      maximumFractionDigits={0}
                    />{" "}
                    akt
                  </p>
                  <p className="Text">Total spent on decloud</p>

                  <Tooltip
                    arrow
                    enterTouchDelay={0}
                    leaveTouchDelay={10000}
                    classes={{ tooltip: classes.tooltip }}
                    title={
                      <>
                        This is the total amount akt spent to rent computing power on the akash
                        network since the beginning of the network. (March 2021)
                      </>
                    }
                  >
                    <i className={clsx("bi bi-question-circle-fill", classes.tooltipIcon)} />
                  </Tooltip>
                </div>
              </div>

              <div className={clsx("col-xs-12", tileClassName)}>
                <div className="Card">
                  <p className="Number">
                    <FormattedNumber value={deploymentCounts.deploymentCount} />
                  </p>
                  <p className="Text">All-time deployment count</p>

                  <Tooltip
                    arrow
                    enterTouchDelay={0}
                    leaveTouchDelay={10000}
                    classes={{ tooltip: classes.tooltip }}
                    title={
                      <>
                        The all-time deployment count consists of all deployments that were live at
                        some point. This includes deployments that were deployed for testing or that
                        were meant to be only temporary.
                      </>
                    }
                  >
                    <i className={clsx("bi bi-question-circle-fill", classes.tooltipIcon)} />
                  </Tooltip>
                </div>
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
                      <div className="Card">
                        <p className="Number">
                          <FormattedNumber value={deploymentCounts.activeDeploymentCount} />
                        </p>
                        <p className="Text">Active deployments</p>

                        <Tooltip
                          arrow
                          enterTouchDelay={0}
                          leaveTouchDelay={10000}
                          classes={{ tooltip: classes.tooltip }}
                          title={
                            <>
                              <div>
                                This is number of deployments currently active on the network. A
                                deployment can be anything.{" "}
                              </div>
                              <div>
                                For example: a simple website to a blockchain node or a video game
                                server.
                              </div>
                            </>
                          }
                        >
                          <i className={clsx("bi bi-question-circle-fill", classes.tooltipIcon)} />
                        </Tooltip>
                      </div>
                    </div>
                  )}

                  <div className={clsx("col-xs-12 col-lg-3")}>
                    <div className="Card">
                      <p className="Number">
                        <FormattedNumber
                          value={deploymentCounts.totalResourcesLeased.cpuSum / 1000}
                        />
                        <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>
                          vCPUs
                        </small>
                      </p>
                      <p className="Text">Compute</p>
                    </div>
                  </div>

                  <div className={clsx("col-xs-12 col-lg-3")}>
                    <div className="Card">
                      <p className="Number">
                        <FormattedNumber
                          value={
                            deploymentCounts.totalResourcesLeased.memorySum / 1024 / 1024 / 1024
                          }
                        />
                        <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>
                          Gi
                        </small>
                      </p>
                      <p className="Text">Memory</p>
                    </div>
                  </div>

                  <div className={clsx("col-xs-12 col-lg-3")}>
                    <div className="Card">
                      <p className="Number">
                        <FormattedNumber
                          value={
                            deploymentCounts.totalResourcesLeased.storageSum / 1024 / 1024 / 1024
                          }
                        />
                        <small style={{ paddingLeft: "5px", fontWeight: "bold", fontSize: 16 }}>
                          Gi
                        </small>
                      </p>
                      <p className="Text">Storage</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {deploymentCounts.snapshots && deploymentCounts.snapshots.length > 0 && (
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
                      Average number of daily active deployments
                    </Typography>
                  </div>
                </div>
                <div className="row justify-content-md-center">
                  <div className="col-lg-12">
                    <ActiveDeploymentCountGraph data={deploymentCounts.snapshots} />
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-12">
                    <p className={clsx("text-white", classes.graphExplanation)}>
                      * The data points represent the average between the minimum and maximum active
                      deployment count for the day.
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <CircularProgress size={80} />
        )}
      </div>
    </>
  );
}
