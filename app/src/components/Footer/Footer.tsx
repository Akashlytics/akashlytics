import React from "react";
import clsx from "clsx";
import { useStyles } from "./Footer.styles";
import { donationAddress } from "@src/shared/contants";
import { copyTextToClipboard } from "@src/shared/utils/copyClipboard";
import { useSnackbar } from "notistack";
import { IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import FileCopyIcon from "@material-ui/icons/FileCopy";

export interface IFooterProps {}

export const Footer: React.FunctionComponent<IFooterProps> = ({}) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const classes = useStyles();

  const onDonationClick = () => {
    copyTextToClipboard(donationAddress);

    const action = (key) => (
      <React.Fragment>
        <IconButton
          onClick={() => {
            closeSnackbar(key);
          }}
          className={classes.snackbarButton}
        >
          <CloseIcon />
        </IconButton>
      </React.Fragment>
    );

    enqueueSnackbar("Address copied!", {
      anchorOrigin: { vertical: "top", horizontal: "right" },
      variant: "success",
      action,
      autoHideDuration: 3000,
    });
  };

  return (
    <footer className="App-footer container">
      <img
        src="/images/powered-by-akash.png"
        className="img-fluid"
        style={{ marginBottom: 50 }}
        alt="Powered by Akash logo"
      />
      <p className="text-white mb-5">(Yes, hosted on akash!)</p>

      <p className="text-on-black">
        Akashlytics is developed to help the community have a better insight on its decentralized
        cloud computing network.
      </p>
      <p className="text-on-black">
        It's also done in my spare time, so any donation would help tremendously! 🍻
      </p>

      <div className="chip clickable donation" onClick={onDonationClick}>
        <span style={{ marginRight: 15 }}>{donationAddress}</span>
        <FileCopyIcon fontSize="small" />
      </div>

      <p className="text-on-black">
        If you have great ideas on how to improve this app, let me know!{" "}
        <a className={classes.link} href="mailto:ideas@akashlytics.com">
          ideas@akashlytics.com
        </a>
      </p>

      <p className="text-on-black mt-5">
        <small>Version: {process.env.PACKAGE_VERSION}</small>
      </p>
    </footer>
  );
};
