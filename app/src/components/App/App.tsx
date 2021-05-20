import "./App.css";
import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { copyTextToClipboard } from "../../utils/copyClipboard";
import { IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import { Helmet } from "react-helmet-async";
import { Header } from "../Header";
import { Switch, Route } from "react-router-dom";
import { Home } from "../Home";
import { PriceCompare } from "../PriceCompare";
import { Faq } from "../Faq";
import { makeStyles } from "@material-ui/core/styles";

const donationAddress = "akash13265twfqejnma6cc93rw5dxk4cldyz2zyy8cdm";

const useStyles = makeStyles((theme) => ({
  link: {
    fontWeight: "bold",
    textDecoration: "underline",
  },
}));

export function App() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [deploymentCounts, setDeploymentCounts] = useState(null);
  const classes = useStyles();

  // get the users
  useEffect(() => {
    async function getDeploymentCounts() {
      try {
        const res = await fetch("/api/getDeploymentCounts");
        const data = await res.json();

        if (data) {
          setDeploymentCounts(data);
        }
      } catch (error) {
        console.log(error);
      }
    }

    getDeploymentCounts();
  }, []);

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
      <Helmet defaultTitle="Akashlytics" titleTemplate="Akashlytics - %s" />

      <Header />

      <Switch>
        <Route path="/faq">
          <Faq />
        </Route>
        <Route path="/price-compare">
          <PriceCompare marketData={deploymentCounts && deploymentCounts.marketData} />
        </Route>
        <Route path="/">
          <Home deploymentCounts={deploymentCounts} />
        </Route>
      </Switch>

      <footer className="App-footer container">
        <img
          src="/images/powered-by-akash.png"
          className="img-fluid"
          style={{ marginBottom: 50 }}
          alt="Powered by Akash logo"
        />
        <p className="text-white mb-5">(Yes, hosted on akash!)</p>

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

        <p className="text-on-black">
          If you have great ideas on how to improve this app, let me know!{" "}
          <a className={classes.link} href="mailto:ideas@akashlytics.com">
            ideas@akashlytics.com
          </a>
        </p>
      </footer>
    </div>
  );
}
