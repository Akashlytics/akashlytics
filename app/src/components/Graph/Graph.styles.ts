
import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "800px",
    margin: "auto",
  },
  loading: { textAlign: "center", marginTop: "4rem", marginBottom: "1rem" },
  graphContainer: {
    height: "400px"
  },
  graphTooltip: {
    padding: "5px",
    color: "white",
    fontWeight: "bold"
  },
  graphExplanation: {
    fontSize: ".8rem",
    paddingTop: "1rem",
    fontStyle: "italic",
    textAlign: "center"
  },
  title: {
    color: "white",
    fontSize: "2rem",
    fontWeight: "bold",
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
    color: "white",
    [theme.breakpoints.down("xs")]: {
      flexBasis: "100%",
      marginBottom: "1rem"
    }
  },
  titleValue: {
    fontSize: "1.5rem",
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