import "./App.css";
import React, { useEffect, useState } from "react";
import ReactTooltip from "react-tooltip";
import clsx from "clsx";
import { FormattedNumber } from "react-intl";
import AktAmount from "../AktAmount/AktAmount";
import { useSnackbar } from "notistack";
import { copyTextToClipboard } from "../../utils/copyClipboard";
import { IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import CircularProgress from "@material-ui/core/CircularProgress";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { Header } from "../Header";
import { Switch, Route, Link } from "react-router-dom";
import { Home } from "../Home";
import { PriceCompare } from "../PriceCompare";

const donationAddress = "akash13265twfqejnma6cc93rw5dxk4cldyz2zyy8cdm";

function App() {
  const [deploymentCounts, setDeploymentCounts] = useState(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

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

  const onDonationClick = () => {
    copyTextToClipboard(donationAddress);

    const action = (key) => (
      <React.Fragment>
        <IconButton
          onClick={() => {
            closeSnackbar(key);
          }}
          style={{ color: "white" }}
        >
          <CloseIcon />
        </IconButton>
      </React.Fragment>
    );

    enqueueSnackbar("Address copied!", {
      anchorOrigin: { vertical: "top", horizontal: "right" },
      variant: "success",
      action,
      autoHideDuration: 3000,
    });
  };

  return (
    <div className="App">
      <Header />

      <Switch>
        <Route path="/price-compare">
          <PriceCompare />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </Switch>

      <footer className="App-footer container">
        <img
          src="/images/powered-by-akash.png"
          className="img-fluid"
          style={{ marginBottom: 50 }}
          alt="Powered by Akash logo"
        />

        <p className="text-on-black">
          Akashlytics is developed to help the community have a better insight on its decentralized
          cloud computing network.
        </p>
        <p className="text-on-black">
          It's also done in my spare time, so any donation would help tremendously! 🍻
        </p>

        <div className="chip clickable donation" onClick={onDonationClick}>
          <span style={{ marginRight: 15 }}>{donationAddress}</span>
          <FileCopyIcon fontSize="small" />
        </div>
      </footer>
    </div>
  );
}

export default App;
