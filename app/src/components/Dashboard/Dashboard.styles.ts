import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  title: {
    fontWeight: "lighter",
    fontSize: "2rem",
    paddingBottom: "1rem",
    textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  link: {
    textDecoration: "underline"
  },
  liveChip: {
    "&&": {
      fontWeight: "normal",
      marginLeft: "1rem",
      fontSize: ".8rem",
      height: "20px"
    }
  },
  liveChipIcon: {
    animation: "$flash 1.5s infinite ease-in-out",
  },
  "@keyframes flash": {
    "0%": {
      color: "#00945c" // TODO Theme
    },
    "50%": {
      color: "#00d081"
    },
    "100%": {
      color: "#00945c"
    }
  },
  priceDataContainer: {
    backgroundColor: "rgba(0,0,0,0.1)",
    padding: "1rem",
    marginBottom: "1rem",
    borderRadius: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "column",
    // alignItems: "baseline"
  }
}));