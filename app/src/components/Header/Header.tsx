import "./Header.css";
import React, { useState } from "react";
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
import { NavDrawer } from "../NavDrawer";
import { Link, useLocation } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    backgroundColor: "#282c34",
  },
  menuButton: {
    marginRight: theme.spacing(2),
    zIndex: 111,
  },
  toolbar: {
    minHeight: 80,
    alignItems: "center",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  logoContainerSmall: {
    flexGrow: 1,
    justifyContent: "center",
    position: "absolute",
    width: "100%",
    left: 0,
  },
  logo: { height: "2.5rem", width: "2.5rem", marginRight: 15 },
  title: {
    flexGrow: 1,
    fontWeight: "bold",
    alignSelf: "baseline",
  },
  titleSmall: {
    flexGrow: "initial",
  },

  // nav
  navDisplayFlex: {
    display: "flex",
    justifyContent: "flex-end",
    flexGrow: 1,
  },
  linkText: {
    textDecoration: "none",
    textTransform: "uppercase",
    color: "white",
  },
  navButton: {
    borderRadius: "5px",
  },
}));

const navLinks = [
  // { title: `about us`, path: `/about-us` },
  { title: `price compare`, path: `/price-compare` },
  { title: `faq`, path: `/faq` }
];

export function Header() {
  const classes = useStyles();
  const mediaQuery = useMediaQueryContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }

    setIsDrawerOpen(open);
  };

  return (
    <AppBar position="static" className={classes.appBar}>
      <Toolbar className={clsx(classes.toolbar, { container: !mediaQuery.smallScreen })}>
        {mediaQuery.smallScreen && (
          <>
            <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>

            <NavDrawer toggleDrawer={toggleDrawer} isDrawerOpen={isDrawerOpen} />
          </>
        )}

        <div
          className={clsx(classes.logoContainer, {
            [classes.logoContainerSmall]: mediaQuery.smallScreen && !mediaQuery.phoneView,
          })}
        >
          <Link to="/" className={classes.logoContainer}>
            <img
              src="/images/akash-network-akt-logo.png"
              alt="Akash logo"
              className={clsx(classes.logo, "App-logo")}
            />

            <Typography
              className={clsx(classes.title, {
                [classes.titleSmall]: mediaQuery.smallScreen && !mediaQuery.phoneView,
              })}
              variant="h5"
            >
              Akashlytics
            </Typography>
          </Link>
        </div>

        {!mediaQuery.smallScreen && (
          <List
            component="nav"
            aria-labelledby="main navigation"
            className={classes.navDisplayFlex}
          >
            {navLinks.map(({ title, path }) => (
              <Link to={path} key={title} className={classes.linkText}>
                <ListItem
                  button
                  selected={location.pathname === path}
                  classes={{ root: classes.navButton }}
                >
                  <ListItemText primary={title} />
                </ListItem>
              </Link>
            ))}
          </List>
        )}
      </Toolbar>
    </AppBar>
  );
}
