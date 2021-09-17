
import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "800px",
    margin: "auto",
  },
  loading: { textAlign: "center", marginTop: "4rem", marginBottom: "1rem" },
  graphContainer: {
    height: "400px",
    position: "relative"
  },
  watermark: {
    position: "absolute",
    top: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    "& span": {
      fontWeight: "bold",
      letterSpacing: "1px",
      fontSize: "1rem",
      color: "rgba(255,255,255,.2)"
    }
  },
  graphTooltip: {
    padding: "5px 10px",
    fontWeight: "bold",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: ".5rem",
    lineHeight: "1rem"
  },
  graphExplanation: {
    fontSize: ".8rem",
    paddingTop: "1rem",
    fontStyle: "italic",
    textAlign: "center"
  },
  title: {
    fontSize: "2rem",
    [theme.breakpoints.down("xs")]: {
      textAlign: "center"
    }
  },
  subTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    [theme.breakpoints.down("xs")]: {
      flexWrap: "wrap"
    }
  },
  subTitleValues: {
    [theme.breakpoints.down("xs")]: {
      flexBasis: "100%",
      marginBottom: "1rem"
    }
  },
  titleValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down("xs")]: {
      justifyContent: "center"
    }
  },
  diffNumber: {
    fontSize: ".7rem",
    fontWeight: "lighter"
  },
  graphRangeSelect: {
    [theme.breakpoints.down("xs")]: {
      margin: "0 auto"
    }
  }
}));