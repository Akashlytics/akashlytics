import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  title: {
    color: theme.palette.primary.contrastText,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "4rem"
  },
  subTitle: {
    color: theme.palette.primary.contrastText,
    textAlign: "center",
    fontWeight: 300,
    fontSize: "2rem"
  }
}));