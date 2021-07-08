import React from "react";
import clsx from "clsx";
import { useStyles } from "./Deploy.styles";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";
import { HelmetSocial } from "@src/shared/components/HelmetSocial";
import { Box, ButtonGroup, Typography } from "@material-ui/core";
import { Button } from "@material-ui/core";

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

        <Box marginTop="3rem" textAlign="center">
          <Typography variant="h5" className={classes.subSubTitle}>
            Akashlytics Deploy is a desktop app that greatly simplify and enhance deployments on
            Akash.
          </Typography>

          <Box marginTop="2rem">
            <Typography variant="h5">Download</Typography>

            <div className={classes.actionButtonContainer}>
              <Button
                size="large"
                variant="contained"
                classes={{ root: classes.actionButton, label: classes.actionButtonLabel }}
              >
                Windows
              </Button>

              <Button
                size="large"
                variant="contained"
                classes={{ root: classes.actionButton, label: classes.actionButtonLabel }}
              >
                macOS <small>(coming soon)</small>
              </Button>
            </div>

            <Typography variant="caption">v0.2.1</Typography>
          </Box>
        </Box>
      </div>
    </>
  );
};
