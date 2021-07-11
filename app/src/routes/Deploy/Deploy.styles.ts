import { makeStyles } from "@material-ui/core/styles";
import { akashRedGradient } from "@src/shared/utils/colorUtils";

export const useStyles = makeStyles((theme) => ({
  title: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "3rem",
    [theme.breakpoints.down("xs")]: {
      fontSize: "2.5rem"
    }
  },
  subTitle: {
    textAlign: "center",
    fontWeight: 300,
    fontSize: "2.5rem",
    [theme.breakpoints.down("xs")]: {
      fontSize: "1.5rem"
    }
  },
  subSubTitle: {
    fontWeight: 300,
    fontSize: "1.1rem"
  },
  actionButtonContainer: {
    margin: ".5rem auto",
    display: "flex",
    justifyContent: "center",
    maxWidth: "640px"
  },
  actionButton: {
    margin: ".5rem",
    background: akashRedGradient,
    color: theme.palette.primary.contrastText,
    padding: ".7rem 2rem",
    textTransform: "initial",
    fontSize: "1.2rem",
    flexBasis: "50%"
  },
  actionButtonLabel: {
    display: "flex",
    flexDirection: "column",
    "& small": {
      fontSize: ".7rem"
    }
  },
  disclaimerTitle: {
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  disclaimerList: {
    textDecoration: "none",
  },
  link: {
    fontWeight: "bold",
    textDecoration: "underline",
  },
  socials: {
    textAlign: "center"
  },
  socialLink: {
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
    height: "3rem",
    width: "3rem",
    fontSize: "3rem",
    display: "block",
    margin: "0 auto"
  },
  alert: {
    margin: "1rem auto",
    maxWidth: 640
  }
}));