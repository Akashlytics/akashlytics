import "./App.css";
import clsx from "clsx";
import React from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@src/components/Header";
import { Switch, Route, Redirect } from "react-router-dom";
import { Home } from "../Home";
import { PriceCompare } from "../PriceCompare";
import { Faq } from "@src/routes/Faq";
import { makeStyles } from "@material-ui/core/styles";
import { Graph } from "../Graph";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import { Deploy } from "@src/routes/Deploy";
import { Footer } from "@src/components/Footer";
import { BetaBanner } from "@src/components/BetaBanner";

const useStyles = makeStyles((theme) => ({
  appBody: {
    paddingTop: "2rem",
    paddingBottom: 80,
    minHeight: "calc(90vh - 80px)"
  },
  appBodySmall: {
    paddingBottom: 50
  }
}));

export function App() {
  const mediaQuery = useMediaQueryContext();
  const classes = useStyles();

  return (
    <div>
      <Helmet defaultTitle="Akashlytics" titleTemplate="Akashlytics - %s" />

      <Header />

      <BetaBanner />

      <div className={clsx(classes.appBody, { [classes.appBodySmall]: mediaQuery.smallScreen })}>
        <Switch>
          <Redirect from="/revenue/daily" to="/graph/daily-akt-spent" />
          <Redirect from="/revenue/total" to="/graph/total-akt-spent" />
          <Route path="/faq">
            <Faq />
          </Route>
          <Route path="/price-compare">
            <PriceCompare />
          </Route>
          <Route path="/graph/:snapshot">
            <Graph />
          </Route>
          <Route path="/deploy">
            <Deploy />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>

      <Footer />
    </div>
  );
}
