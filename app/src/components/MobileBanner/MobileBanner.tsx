import React, { useState } from "react";
import {
  makeStyles,
  AppBar,
  Toolbar,
  Chip,
  Typography,
  IconButton,
  Button,
  Box,
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { Link } from "react-router-dom";
import { useMediaQueryContext } from "@src/context/MediaQueryProvider";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: "1rem",
    paddingBottom: "1rem",
  },
  grow: { flexGrow: 1 },
  betaChip: {
    fontWeight: "bold",
  },
  betaText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "baseline",
    padding: "0 1rem",
  },
}));

export const MobileBanner = () => {
  const [isBetaBarVisible, setIsBetaBarVisible] = useState(true);
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();

  return (
    <>
      {isBetaBarVisible && mediaQuery.smallScreen && (
        <AppBar position="static" color="default" className={classes.root}>
          <Toolbar>
            <Chip label="BETA" color="primary" className={classes.betaChip} />
            <div className={classes.betaText}>
              <Box marginBottom=".5rem">
                <Typography variant="body2">
                  Akashlytics Deploy is now currently in open BETA.
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/deploy"
                variant="contained"
                size="small"
                onClick={() => setIsBetaBarVisible(false)}
              >
                Take a look!
              </Button>
            </div>

            <div className={classes.grow} />
            <IconButton
              aria-label="Close beta app bar"
              color="inherit"
              onClick={() => setIsBetaBarVisible(false)}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
    </>
  );
};
