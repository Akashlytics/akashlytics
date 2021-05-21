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
    padding: "15px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: `
      0px 11px 15px -7px rgb(175 24 23 / 20%), 
      0px 24px 38px 3px rgb(175 24 23 / 14%),
      0px 9px 46px 8px rgb(175 24 23 / 12%)
    `
  },
  number: {
    fontSize: "40px",
    fontWeight: "bold"
  },
  text: {
    fontSize: "1.2rem",
    fontWeight: "lighter"
  },
  extraText: {
    fontWeight: "bold",
    fontSize: 12,
    display: "block",
    marginTop: "-10px",
  },
  tooltipIcon: {
    position: "absolute",
    top: 5,
    right: 10,
    fontSize: "1.2rem",
  },
  tooltip: {
    maxWidth: 300,
    fontSize: "1rem",
    borderRadius: ".5rem",
    fontWeight: "normal",
  },
}));