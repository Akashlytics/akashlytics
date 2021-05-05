import React, { useEffect, useState } from "react";
import ReactTooltip from "react-tooltip";
import clsx from "clsx";
import { FormattedNumber } from "react-intl";
import AktAmount from "../AktAmount/AktAmount";
import CircularProgress from "@material-ui/core/CircularProgress";

export function Home() {
  const [deploymentCounts, setDeploymentCounts] = useState(null);

  // get the users
  useEffect(() => {
    async function getDeploymentCounts() {
      const res = await fetch("/api/getDeploymentCounts");
      const data = await res.json();

      if (data) {
        setDeploymentCounts(data);
      }
    }

    getDeploymentCounts();
  }, []);

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
    <div className="container App-body">
      {deploymentCounts !== null ? (
        <div className="row">
          <div className={clsx("col-xs-12", tileClassName)}>
            <div className="Card">
              <p className="Number">
                <FormattedNumber value={deploymentCounts.activeDeploymentCount} />
              </p>
              <p className="Text">Active deployments</p>
            </div>
          </div>

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
                  <AktAmount
                    uakt={deploymentCounts.averagePrice}
                    usdPrice={deploymentCounts.marketData.computedPrice}
                    showInUSD={true}
                  />
                  <small
                    style={{
                      fontWeight: "bold",
                      fontSize: 12,
                      display: "block",
                      marginTop: "-10px",
                    }}
                  >
                    (<AktAmount uakt={deploymentCounts.averagePrice} />)
                  </small>
                </p>

                <p className="Text">
                  Monthly cost for a small instance{" "}
                  <i className="bi bi-question-circle-fill" data-tip data-for="instanceDef"></i>
                </p>
                <ReactTooltip
                  className="tooltip"
                  id="instanceDef"
                  place="bottom"
                  type="error"
                  effect="solid"
                >
                  Average based on these specs:
                  <br />
                  cpu: 0.1
                  <br />
                  memory: 512Mi
                  <br />
                  storage: 512Mi
                </ReactTooltip>
              </div>
            </div>
          )}

          <div className={clsx("col-xs-12", tileClassName)}>
            <div className="Card">
              <p className="Number">
                <FormattedNumber value={deploymentCounts.deploymentCount} />
              </p>
              <p className="Text">Total deployments</p>
            </div>
          </div>
        </div>
      ) : (
        <CircularProgress size={80} />
      )}
    </div>
  );
}
