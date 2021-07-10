import "./App.css";
import clsx from "clsx";
import React from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@src/components/Header";
import { Switch, Route } from "react-router-dom";
import { Home } from "../Home";
import { PriceCompare } from "../PriceCompare";
import { Faq } from "@src/components/Faq";
import { makeStyles } from "@material-ui/core/styles";
import { Graph } from "../Graph";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import { useDashboardData } from "@src/queries/useDashboardData";
import { Deploy } from "@src/routes/Deploy";
import { Footer } from "@src/components/Footer";
import { MobileBanner } from "@src/components/MobileBanner";

const useStyles = makeStyles((theme) => ({
  appBody: {
    paddingTop: 60,
    paddingBottom: 80,
  },
  appBodySmall: {
    paddingTop: 25,
    paddingBottom: 50,
  },
}));

export function App() {
  const { data: deploymentCounts, status } = useDashboardData();

  const mediaQuery = useMediaQueryContext();
  const classes = useStyles();

  return (
    <div>
      <Helmet defaultTitle="Akashlytics" titleTemplate="Akashlytics - %s" />

      <Header />

      <MobileBanner />

      <div className={clsx(classes.appBody, { [classes.appBodySmall]: mediaQuery.smallScreen })}>
        <Switch>
          <Route path="/faq">
            <Faq />
          </Route>
          <Route path="/price-compare">
            <PriceCompare marketData={deploymentCounts && deploymentCounts.marketData} />
          </Route>
          <Route path="/graph/:snapshot">
            <Graph />
          </Route>
          <Route path="/deploy">
            <Deploy />
          </Route>
          <Route path="/">
            <Home deploymentCounts={deploymentCounts} />
          </Route>
        </Switch>
      </div>

      <Footer />
    </div>
  );
}
