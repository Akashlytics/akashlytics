
import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  root: {
    height: "400px",
    maxWidth: "800px",
    margin: "auto",
  },
  graphTooltip: {
    padding: "5px",
    color: "white",
    fontWeight: "bold"
  }
}));