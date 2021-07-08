import { makeStyles } from "@material-ui/core/styles";
import { akashRedGradient } from "@src/shared/utils/colorUtils";

export const useStyles = makeStyles((theme) => ({
  title: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "3.5rem"
  },
  subTitle: {
    textAlign: "center",
    fontWeight: 300,
    fontSize: "2rem"
  },
  subSubTitle: {
    fontWeight: 300,
    fontSize: "1.2rem"
  },
  actionButtonContainer: {
    marginTop: "1rem",
    display: "flex",
    justifyContent: "center",
    alignItem: "center"
  },
  actionButton: {
    margin: ".5rem",
    background: akashRedGradient,
    color: theme.palette.primary.contrastText
  },
  actionButtonLabel: {
    display: "flex",
    flexDirection: "column",
    "& small": {
      fontSize: ".7rem"
    }
  }
}));