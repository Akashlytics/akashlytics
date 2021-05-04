import "./Header.css";
import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import { useMediaQueryContext } from "../../context/MediaQueryProvider";
import clsx from "clsx";

import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: "#282c34",
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  toolbar: {
    minHeight: 80,
    alignItems: "center",
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(2),
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logo: { height: "2.5rem", marginRight: 15 },
  title: {
    flexGrow: 1,
    fontWeight: "bold",
  },

  // nav
  navbarDisplayFlex: {
    display: `flex`,
    justifyContent: `space-between`,
  },
  navDisplayFlex: {
    display: `flex`,
    justifyContent: `space-between`,
  },
  linkText: {
    textDecoration: `none`,
    textTransform: `uppercase`,
    color: `white`,
  },
}));

const navLinks = [
  { title: `about us`, path: `/about-us` },
  { title: `price compare`, path: `/price-compare` },
  { title: `faq`, path: `/faq` },
];

export function Header() {
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();

  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar className={clsx(classes.toolbar, { container: !mediaQuery.smallScreen })}>
        {mediaQuery.smallScreen && (
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="open drawer"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Link to="/" className={classes.logoContainer}>
          <img
            src="/images/akash-network-akt-logo.png"
            alt="Akash logo"
            className={clsx(classes.logo, "App-logo")}
          />

          <Typography className={classes.title} variant="h5">
            Akashlytics
          </Typography>
        </Link>

        <List component="nav" aria-labelledby="main navigation" className={classes.navDisplayFlex}>
          {navLinks.map(({ title, path }) => (
            <Link to={path} key={title} className={classes.linkText}>
              <ListItem button>
                <ListItemText primary={title} />
              </ListItem>
            </Link>
          ))}
        </List>
      </Toolbar>
    </AppBar>
  );
}
