import { makeStyles } from "@material-ui/core/styles";
import { akashRedGradient } from "@src/shared/utils/colorUtils";

export const useStyles = makeStyles((theme) => ({
  title: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "3rem"
  },
  subTitle: {
    textAlign: "center",
    fontWeight: 300,
    fontSize: "2.5rem"
  },
  subSubTitle: {
    fontWeight: 300,
    fontSize: "1.1rem"
  },
  actionButtonContainer: {
    margin: ".5rem auto",
    display: "flex",
    justifyContent: "center",
    maxWidth: "640px"
  },
  actionButton: {
    margin: ".5rem",
    background: akashRedGradient,
    color: theme.palette.primary.contrastText,
    padding: ".7rem 2rem",
    textTransform: "initial",
    fontSize: "1.2rem",
    flexBasis: "50%"
  },
  actionButtonLabel: {
    display: "flex",
    flexDirection: "column",
    "& small": {
      fontSize: ".7rem"
    }
  }
}));