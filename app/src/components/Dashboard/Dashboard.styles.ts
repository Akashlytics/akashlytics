import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  title: {
    color: "white",
    fontWeight: "lighter",
    fontSize: "2rem",
    paddingBottom: "1rem",
    textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  link: {
    textDecoration: "underline"
  }
}));