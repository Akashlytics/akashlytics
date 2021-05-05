import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import AttachMoneyIcon from "@material-ui/icons/AttachMoney";
import clsx from "clsx";
import {
  IconButton,
  Typography,
  Avatar,
  ListItemAvatar,
  List,
  ListSubheader,
  ListItem,
  ListItemText,
  ListItemIcon,
  SwipeableDrawer,
  Button,
} from "@material-ui/core";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  list: {
    width: 250,
  },
  listSubHeader: {
    display: "flex",
    paddingTop: 15,
    paddingBottom: 15,
    alignItem: "center",
  },
  listSubHeaderLogo: {
    height: 30,
    marginRight: 25,
  },
  listSubHeaderTitle: {
    fontWeight: "bold",
  },
}));

export function NavDrawer({ isDrawerOpen, toggleDrawer }) {
  const classes = useStyles();
  const anchor = "left";

  return (
    <React.Fragment>
      <SwipeableDrawer
        anchor={anchor}
        open={isDrawerOpen}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
      >
        <div
          className={clsx(classes.list)}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List
            subheader={
              <ListSubheader
                component="div"
                id="nested-list-subheader"
                className={classes.listSubHeader}
              >
                <img
                  src="/images/akash-network-akt-logo.png"
                  alt="Akash logo"
                  className={clsx(classes.listSubHeaderLogo, "App-logo")}
                />

                <Typography className={clsx(classes.listSubHeaderTitle)} variant="h5">
                  Akashlytics
                </Typography>
              </ListSubheader>
            }
          >
            <ListItem button component={Link} to="/price-compare">
              <ListItemIcon>
                <AttachMoneyIcon />
              </ListItemIcon>
              <ListItemText primary="Compare price" />
            </ListItem>
          </List>
        </div>
      </SwipeableDrawer>
    </React.Fragment>
  );
}
