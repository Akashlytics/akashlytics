
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
    textAlign: "center",
    fontWeight: "bold",
  }
}));