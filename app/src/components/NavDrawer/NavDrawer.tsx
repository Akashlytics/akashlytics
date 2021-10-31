import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import AttachMoneyIcon from "@material-ui/icons/AttachMoney";
import DashboardIcon from "@material-ui/icons/Dashboard";
import HelpIcon from "@material-ui/icons/Help";
import clsx from "clsx";
import { Typography, List, ListSubheader, ListItem, ListItemText, ListItemIcon, SwipeableDrawer } from "@material-ui/core";
import { Link } from "react-router-dom";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";

const useStyles = makeStyles((theme) => ({
  list: {
    width: 250
  },
  listSubHeader: {
    display: "flex",
    paddingTop: 15,
    paddingBottom: 15,
    alignItem: "center"
  },
  listSubHeaderLogo: {
    height: "4rem"
  },
  listSubHeaderTitle: {
    fontWeight: "bold"
  }
}));

export function NavDrawer({ isDrawerOpen, toggleDrawer }) {
  const classes = useStyles();
  const anchor = "left";

  return (
    <React.Fragment>
      <SwipeableDrawer anchor={anchor} open={isDrawerOpen} onClose={toggleDrawer(false)} onOpen={toggleDrawer(true)}>
        <div className={clsx(classes.list)} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
          <List
            subheader={
              <ListSubheader component={Link} to="/" id="nested-list-subheader" className={classes.listSubHeader}>
                <img src="/images/akashlytics_logo_compact_small.png" alt="Akashlytics logo" className={clsx(classes.listSubHeaderLogo, "App-logo")} />
              </ListSubheader>
            }
          >
            <ListItem button component={Link} to="/">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/price-compare">
              <ListItemIcon>
                <AttachMoneyIcon />
              </ListItemIcon>
              <ListItemText primary="Compare price" />
            </ListItem>
            <ListItem button component={Link} to="/faq">
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText primary="FAQ" />
            </ListItem>
            <ListItem button component={Link} to="/deploy">
              <ListItemIcon>
                <CloudUploadIcon />
              </ListItemIcon>
              <ListItemText primary="Deploy" />
            </ListItem>
          </List>
        </div>
      </SwipeableDrawer>
    </React.Fragment>
  );
}
