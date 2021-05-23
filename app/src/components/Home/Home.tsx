import React, { useState } from "react";
import clsx from "clsx";
import { CircularProgress } from "@material-ui/core";
import { Graph } from "../Graph";
import { Helmet } from "react-helmet-async";
import { useStyles } from "./Home.styles";
import { Dashboard } from "../Dashboard";
import { DashboardData } from "@src/shared/models";

export interface IHomeProps {
  deploymentCounts: DashboardData;
}

export const Home: React.FunctionComponent<IHomeProps> = ({ deploymentCounts }) => {
  const classes = useStyles();

  return (
    <>
      <Helmet title="Dashboard" />
      <div className={clsx("container")}>
        {deploymentCounts ? (
          <Dashboard deploymentCounts={deploymentCounts} />
        ) : (
          <CircularProgress size={80} />
        )}
      </div>
    </>
  );
};
