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
    marginBottom: "1.5rem",
    borderRadius: "1rem",
    display: "flex",
    alignItems: "center",
    fontSize: "1rem",
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      alignItems: "baseline"
    }
  },
  priceData: {
    marginLeft: "1rem",
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down("sm")]: {
      marginLeft: "0",
    }
  },
  priceDataValue: {
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    marginLeft: ".5rem"
  }
}));