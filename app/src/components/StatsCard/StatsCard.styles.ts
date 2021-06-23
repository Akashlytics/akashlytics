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
  },
  rootSmall: {
    marginTop: 12,
    marginBottom: 12,
    height: "auto"
  },
  number: {
    fontSize: "1.8rem",
    fontWeight: "bold"
  },
  cardHeader: { width: "100%", padding: "1rem", textAlign: "center" },
  title: {
    fontSize: "1rem",
    fontWeight: "lighter",
    margin: 0,
    borderBottom: "1px solid rgba(255,255,255,0.25)",
    paddingBottom: "3px"
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
  tooltip: {
    fontSize: "1.1rem",
    margin: "8px",
    position: "absolute",
    top: 0,
    right: 0
  },
  subHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: ".7rem"
  },
  actionIcon: {
    fontSize: "1rem"
  },
  actionButtonLabel: {
    fontSize: ".7rem"
  }
}));