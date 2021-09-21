import React from "react";
import clsx from "clsx";
import { useStyles } from "./Footer.styles";
import { donationAddress } from "@src/shared/contants";
import { copyTextToClipboard } from "@src/shared/utils/copyClipboard";
import { useSnackbar } from "notistack";
import { Box, Chip, Grid, IconButton, Typography } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import CopyrightIcon from "@material-ui/icons/Copyright";
import YouTubeIcon from "@material-ui/icons/YouTube";
import TwitterIcon from "@material-ui/icons/Twitter";
import GitHubIcon from "@material-ui/icons/GitHub";
import { DiscordIcon } from "@src/shared/components/icons";

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
        >
          <CloseIcon />
        </IconButton>
      </React.Fragment>
    );

    enqueueSnackbar("Address copied!", {
      anchorOrigin: { vertical: "bottom", horizontal: "right" },
      variant: "success",
      action,
      autoHideDuration: 3000
    });
  };

  return (
    <footer className={clsx("container", classes.root)}>
      <Grid container spacing={2}>
        <Grid item sm={4}>
          <Typography variant="h3" className={classes.title}>
            Akashlytics
          </Typography>
          <Typography variant="h5" className={classes.subSitle}>
            We make tools to boost and enhance <strong>web3</strong> adoption.
          </Typography>
          <img src="/images/powered-by-akash.png" className={clsx("img-fluid", classes.poweredAkash)} alt="Powered by Akash logo" />
        </Grid>
        <Grid item sm={8}>
          <Grid container>
            <Grid item sm={6}>
              <Typography variant="body2" className={classes.sectionTitle}>
                <strong>Support</strong>
              </Typography>
              <Chip label={donationAddress} size="small" deleteIcon={<FileCopyIcon fontSize="small" />} onDelete={onDonationClick} onClick={onDonationClick} />
            </Grid>
            <Grid item sm={6}>
              <Typography variant="body2" className={classes.sectionTitle}>
                Follow
              </Typography>
              <ul className={classes.socialLinks}>
                <li>
                  <a href="https://discord.gg/rXDFNYnFwv" target="_blank" className={classes.socialLink}>
                    <DiscordIcon className={classes.socialIcon} />
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/channel/UC1rgl1y8mtcQoa9R_RWO0UA?sub_confirmation=1" target="_blank" className={classes.socialLink}>
                    <YouTubeIcon className={classes.socialIcon} />
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com/thereisnomax" target="_blank" className={classes.socialLink}>
                    <TwitterIcon className={classes.socialIcon} />
                  </a>
                </li>
                <li>
                  <a href="https://github.com/Akashlytics/akashlytics" target="_blank" className={classes.socialLink}>
                    <GitHubIcon className={classes.socialIcon} />
                  </a>
                </li>
              </ul>
            </Grid>
          </Grid>

          <Grid item sm={12}>
            <Typography variant="body2" className={classes.sectionTitle}>
              Ideas
            </Typography>
            <Typography variant="caption">
              We are ready for the challenge{" "}
              <a className={classes.link} href="mailto:ideas@akashlytics.com">
                ideas@akashlytics.com
              </a>
            </Typography>
          </Grid>
        </Grid>
      </Grid>

      <Box className={classes.meta}>
        <Box>
          <small>Version: {process.env.PACKAGE_VERSION}</small>
        </Box>
        <Box>
          <CopyrightIcon /> Akashlytics
        </Box>
      </Box>
    </footer>
  );
};
