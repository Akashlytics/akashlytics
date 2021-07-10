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
import { useEffect } from "react";

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

export const BetaBanner = () => {
  const [isBetaBarVisible, setIsBetaBarVisible] = useState(true);
  const classes = useStyles();

  useEffect(() => {
    const isBetaBarSeen = localStorage.getItem("isBetaBarSeen");
    setIsBetaBarVisible(isBetaBarSeen === undefined ? true : false);
  }, []);

  const hideIsBetaBarVisible = () => {
    localStorage.setItem("isBetaBarSeen", "true");
    setIsBetaBarVisible(false);
  };

  return (
    <>
      {isBetaBarVisible && (
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
                onClick={() => hideIsBetaBarVisible()}
              >
                Take a look!
              </Button>
            </div>

            <div className={classes.grow} />
            <IconButton
              aria-label="Close beta app bar"
              color="inherit"
              onClick={() => hideIsBetaBarVisible()}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
    </>
  );
};
