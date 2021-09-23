import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  root: {
    background: "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgb(38 41 48) 77%, rgb(40 44 52) 100%)",
    borderTop: "4px solid #252930",
    paddingTop: "2rem",
    [theme.breakpoints.down("xs")]: {
      textAlign: "center"
    }
  },
  link: {
    fontWeight: "bold",
    textDecoration: "underline",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: ".5rem"
  },
  subSitle: {
    fontSize: "1rem",
    fontWeight: "lighter"
  },
  donationLabel: {
    maxWidth: "15rem"
  },
  poweredAkash: {
    margin: "2rem -1rem",
    height: "2.5rem",
    [theme.breakpoints.down("xs")]: {
      marginBottom: "0rem"
    }
  },
  sectionTitle: {
    fontWeight: "bold",
    padding: ".5rem 0",
    fontSize: "1rem",
    [theme.breakpoints.down("xs")]: {
      marginTop: "1rem"
    }
  },
  socialLinks: {
    listStyle: "none",
    display: "flex",
    padding: 0,
    margin: 0,
    [theme.breakpoints.down("xs")]: {
      justifyContent: "center"
    }
  },
  socialLink: {
    display: "block",
    padding: ".5rem 1rem",
    transition: ".3s all ease",
    "& path": {
      fill: "#fff",
      transition: ".3s all ease",
    },
    "&:hover": {
      color: theme.palette.primary.main,
      "& path": {
        fill: theme.palette.primary.main
      }
    }
  },
  socialIcon: {
    height: "2rem",
    width: "2rem",
    fontSize: "3rem",
    display: "block",
    margin: "0 auto"
  },
  meta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "5rem"
  }
}));