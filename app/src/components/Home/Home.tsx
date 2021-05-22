import React, { useState } from "react";
import clsx from "clsx";
import { CircularProgress } from "@material-ui/core";
import { Graph } from "../Graph";
import { Helmet } from "react-helmet-async";
import { useStyles } from "./Home.styles";
import { Dashboard } from "../Dashboard";
import { Snapshots } from "@src/shared/models";

export interface IHomeProps {
  deploymentCounts: any; // TODO
}

export const Home: React.FunctionComponent<IHomeProps> = ({ deploymentCounts }) => {
  const classes = useStyles();

  return (
    <>
      <Helmet title="Dashboard" />
      <div className={clsx("container")}>
        {deploymentCounts !== null ? (
          <Dashboard deploymentCounts={deploymentCounts} />
        ) : (
          <CircularProgress size={80} />
        )}
      </div>
    </>
  );
};
