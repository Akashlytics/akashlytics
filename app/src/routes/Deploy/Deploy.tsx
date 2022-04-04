import React, { useEffect, useState } from "react";
import { useStyles } from "./Deploy.styles";
import { HelmetSocial } from "@src/shared/components/HelmetSocial";
import { Box, Chip, CircularProgress, Grid, Typography } from "@material-ui/core";
import { Button } from "@material-ui/core";
import ReactPlayer from "react-player/lazy";
import YouTubeIcon from "@material-ui/icons/YouTube";
import TwitterIcon from "@material-ui/icons/Twitter";
import GitHubIcon from "@material-ui/icons/GitHub";
import { DiscordIcon } from "@src/shared/components/icons";
import { Remarkable } from "remarkable";
import { baseApiUrl } from "@src/shared/contants";

export interface IDeployProps {}

export const Deploy: React.FunctionComponent<IDeployProps> = ({}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [releaseInfo, setReleaseInfo] = useState(null);
  const [releaseNote, setReleaseNote] = useState(null);
  const classes = useStyles();

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${baseApiUrl}/api/latestDeployToolVersion`);
        const data = await response.json();

        setReleaseInfo(data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (releaseInfo) {
      var md = new Remarkable();
      setReleaseNote(md.render(releaseInfo.note));
    }
  }, [releaseInfo?.note]);

  return (
    <>
      <HelmetSocial
        title="Deploy"
        description="Deploy on Akash Network with the first cross-platform desktop application. Decentralized cloud has never been easier to access."
      />
      <div className="container">
        <Typography variant="h1" className={classes.title}>
          Deploy on Akash Network
        </Typography>
        <Typography variant="h3" className={classes.subTitle}>
          In a few clicks!
        </Typography>

        <Box marginTop="1rem" textAlign="center">
          <Typography variant="h5" className={classes.subSubTitle}>
            Akashlytics Deploy is a desktop app that greatly simplifies and enhances deployments on the Akash Network.
          </Typography>

          {!isLoading && releaseInfo && (
            <Box marginTop="2rem">
              <Typography variant="h6">Download</Typography>

              <div className={classes.actionButtonContainer}>
                {releaseInfo.windowsUrl && (
                  <Button
                    size="large"
                    variant="contained"
                    classes={{ root: classes.actionButton, label: classes.actionButtonLabel }}
                    component="a"
                    href={releaseInfo.windowsUrl}
                  >
                    Windows
                  </Button>
                )}

                {releaseInfo.macUrl && (
                  <Button
                    size="large"
                    variant="contained"
                    classes={{ root: classes.actionButton, label: classes.actionButtonLabel }}
                    component="a"
                    href={releaseInfo.macUrl}
                  >
                    macOS
                  </Button>
                )}

                {releaseInfo.linuxUrl && (
                  <Button
                    size="large"
                    variant="contained"
                    classes={{ root: classes.actionButton, label: classes.actionButtonLabel }}
                    component="a"
                    href={releaseInfo.linuxUrl}
                  >
                    Linux
                  </Button>
                )}
              </div>

              <Box display="flex" alignItems="center" justifyContent="center">
                <Chip color="primary" label="BETA" size="small" />
                &nbsp;&nbsp;
                <Typography variant="caption">{releaseInfo.version}</Typography>
              </Box>

              <Typography variant="h6">Release Note ({releaseInfo.version})</Typography>
              <div className={classes.releaseNote} dangerouslySetInnerHTML={{ __html: releaseNote }}></div>
            </Box>
          )}
          {!isLoading && !releaseInfo && (
            <Box marginTop={2}>
              You can find the latest version of the deploy tool on{" "}
              <a className={classes.link} target="_blank" rel="noopener noreferrer" href="https://github.com/Akashlytics/akashlytics-deploy/releases">
                Github
              </a>
              .
            </Box>
          )}
          {isLoading && (
            <>
              <div className={classes.loading}>
                <CircularProgress size={80} />
              </div>
            </>
          )}
        </Box>

        <Box margin="1rem auto" display="flex" justifyContent="center">
          <ReactPlayer url="https://www.youtube.com/watch?v=GNEvWmqW7hI" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} />
        </Box>

        <Box margin="3rem auto 5rem" maxWidth="640px">
          <Box textAlign="center">
            <Typography variant="h4" className={classes.disclaimerTitle}>
              Follow our progress
            </Typography>
          </Box>

          <Grid container spacing={1} className={classes.socials}>
            <Grid item xs={6} sm={3}>
              <a href="https://discord.gg/rXDFNYnFwv" target="_blank" className={classes.socialLink}>
                <DiscordIcon className={classes.socialIcon} />
              </a>
            </Grid>
            <Grid item xs={6} sm={3}>
              <a href="https://www.youtube.com/channel/UC1rgl1y8mtcQoa9R_RWO0UA?sub_confirmation=1" target="_blank" className={classes.socialLink}>
                <YouTubeIcon className={classes.socialIcon} />
              </a>
            </Grid>
            <Grid item xs={6} sm={3}>
              <a href="https://twitter.com/akashlytics" target="_blank" className={classes.socialLink}>
                <TwitterIcon className={classes.socialIcon} />
              </a>
            </Grid>
            <Grid item xs={6} sm={3}>
              <a href="https://github.com/Akashlytics/akashlytics-deploy" target="_blank" className={classes.socialLink}>
                <GitHubIcon className={classes.socialIcon} />
              </a>
            </Grid>
          </Grid>
        </Box>

        <Box margin="5rem auto" maxWidth="640px">
          <Typography variant="h4" className={classes.disclaimerTitle}>
            Disclaimer
          </Typography>

          <u className={classes.disclaimerList}>
            <li>
              Akashlytics Deploy is currently in BETA. We strongly suggest you start with a new wallet and a small amount of AKT until we further stabilize the
              product.
            </li>
            <li>We're not responsible for any loss or damages related to using the app.</li>
            <li>The app has a high chance of containing bugs since it's in BETA, use at your own risk.</li>
          </u>
        </Box>
      </div>
    </>
  );
};
