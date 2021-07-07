import React from "react";
import clsx from "clsx";
import { useStyles } from "./Deploy.styles";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import { HelmetSocial } from "@src/shared/components/HelmetSocial";
import { Typography } from "@material-ui/core";

export interface IDeployProps {}

export const Deploy: React.FunctionComponent<IDeployProps> = ({}) => {
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();

  return (
    <>
      <HelmetSocial
        title="Deploy"
        description="Deploy on Akash Network with the first cross-platform desktop application. Decentralized cloud has never been easier to access."
      />
      <div className="container">
        <Typography variant="h1" className={classes.title}>
          Deploy on Akash Network
        </Typography>
        <Typography variant="h3" className={classes.subTitle}>
          In a few clicks!
        </Typography>

        <div className="row"></div>
      </div>
    </>
  );
};
