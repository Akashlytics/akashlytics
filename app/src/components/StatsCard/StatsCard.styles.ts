import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    background: `linear-gradient(
      90deg,
      rgba(175, 24, 23, 1) 0%,
      rgba(228, 30, 19, 1) 0%,
      rgba(143, 0, 0, 1) 100%
    )`,
    color: "white",
    height: "100%",
    flexGrow: 1,
    borderRadius: "1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: `
    0px 4px 8px -7px rgb(175 24 23 / 20%), 0px 4px 8px 3px rgb(175 24 23 / 14%), 0px 0px 12px 5px rgb(175 24 23 / 12%)
    `
  },
  rootSmall: {
    marginTop: 15,
    marginBottom: 15,
    height: "auto"
  },
  number: {
    fontSize: "2rem",
    fontWeight: "bold"
  },
  cardHeader: { width: "100%", padding: "1rem", textAlign: "center" },
  title: {
    fontSize: "1rem",
    fontWeight: "lighter",
    margin: 0
  },
  extraText: {
    fontWeight: "bold",
    fontSize: 12,
    display: "block",
  },
  cardContent: {
    padding: "0 1rem .5rem",
    textAlign: "center",
    flexGrow: 1
  },
  tooltipIcon: {
    position: "absolute",
    top: 5,
    right: 10,
    fontSize: "1.2rem",
  },
  tooltip: {
    fontSize: "1.2rem",
    margin: "8px"
  },
  subHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: ".7rem"
  }
}));