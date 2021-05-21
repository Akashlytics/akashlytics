import React, { useState } from "react";
import clsx from "clsx";
import { FormattedNumber } from "react-intl";
import { CircularProgress, Typography, Tooltip } from "@material-ui/core";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import { Graph } from "../Graph";
import { Helmet } from "react-helmet-async";
import { useStyles } from "./Home.styles";
import { Dashboard, useStyles as useDashboardStyles } from "../Dashboard";
import { Snapshots } from "@src/shared/models";

export interface IHomeProps {
  deploymentCounts: any; // TODO
}

export const Home: React.FunctionComponent<IHomeProps> = ({ deploymentCounts }) => {
  const [currentGraphSnapshot, setCurrentGraphSnapshot] = useState<Snapshots>(null);
  const classes = useStyles();
  const dashboardClasses = useDashboardStyles();
  const mediaQuery = useMediaQueryContext();

  const onDataClick = (snapshot: Snapshots) => {
    setCurrentGraphSnapshot(snapshot);
  };

  return (
    <>
      <Helmet title="Dashboard" />
      <div className="container App-body">
        {deploymentCounts !== null ? (
          <>
            {!currentGraphSnapshot ? (
              <Dashboard deploymentCounts={deploymentCounts} onDataClick={onDataClick} />
            ) : (
              <Graph snapshot={currentGraphSnapshot} />
            )}
          </>
        ) : (
          <CircularProgress size={80} />
        )}
      </div>
    </>
  );
};
