import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DnsIcon from "@mui/icons-material/Dns";
import { ReactNode } from "react";
import { ColorModeSwitch } from "./ColorModeSwitch";
import Image from "next/image";
import Link from "next/link";
import { cx } from "@emotion/css";
import { useRouter } from "next/router";
import { drawerWidth } from "@src/utils/constants";
import getConfig from "next/config";
import { makeStyles } from "tss-react/mui";
import { KeplrWalletStatus } from "@src/components/layout/KeplrWalletStatus";
import { UrlService } from "@src/utils/urlUtils";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import ReceiptIcon from "@mui/icons-material/Receipt";

const { publicRuntimeConfig } = getConfig();

const useStyles = makeStyles()(theme => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between"
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    width: "100%"
  },
  list: {
    padding: 0,
    overflow: "hidden",
    width: "100%"
  },
  notSelected: {
    color: theme.palette.grey[500],
    fontWeight: "normal"
  },
  selected: {
    fontWeight: "bold"
  },
  version: {
    fontSize: ".7rem",
    fontWeight: "bold",
    color: theme.palette.grey[500]
  }
}));

type Props = {
  children?: ReactNode;
  isMobileOpen: boolean;
  handleDrawerToggle: () => void;
};

export const Sidebar: React.FunctionComponent<Props> = ({ isMobileOpen, handleDrawerToggle }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const router = useRouter();

  const routes = [
    {
      title: "Dashboard",
      icon: props => <DashboardIcon {...props} />,
      url: UrlService.dashboard()
    },
    {
      title: "Blocks",
      icon: props => <ViewInArIcon {...props} />,
      url: UrlService.blocks()
    },
    {
      title: "Transactions",
      icon: props => <ReceiptIcon {...props} />,
      url: UrlService.transactions()
    },
    {
      title: "Validators",
      icon: props => <DnsIcon {...props} />,
      url: UrlService.validators()
    }
  ];

  const drawer = (
    <div className={classes.root} style={{ width: drawerWidth }}>
      <div className={classes.nav}>
        <Image alt="Cloudmos Logo" src="/images/cloudmos-logo.png" quality={100} width={248} height={124} priority />

        <Box paddingTop="2rem" width="100%">
          <List className={classes.list}>
            {routes.map(route => {
              const isSelected = router.pathname === route.url;

              return (
                <ListItem key={route.title} sx={{ paddingLeft: 0, paddingRight: 0 }}>
                  <Link href={route.url} passHref>
                    <Button
                      startIcon={route.icon({ color: isSelected ? "secondary" : "disabled" })}
                      fullWidth
                      color="inherit"
                      className={cx({
                        [classes.selected]: isSelected,
                        [classes.notSelected]: !isSelected
                      })}
                      sx={{
                        justifyContent: "flex-start",
                        paddingLeft: "1rem",
                        paddingRight: "1rem",
                        textTransform: "initial"
                      }}
                    >
                      <Box sx={{ marginLeft: ".5rem" }}>{route.title}</Box>
                    </Button>
                  </Link>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </div>

      <Box sx={{ padding: "0 1rem 2rem", width: "100%", textAlign: "center" }}>
        <Box sx={{ mb: 2 }}>
          <KeplrWalletStatus />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ColorModeSwitch />

          <Image
            alt="Akash Network Logo"
            src={theme.palette.mode === "dark" ? "/images/akash-logo-dark.png" : "/images/akash-logo-light.png"}
            quality={100}
            layout="fixed"
            height="65px"
            width="128px"
            priority
          />
        </Box>

        <small className={classes.version}>v{publicRuntimeConfig?.version}</small>
      </Box>
    </div>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="mailbox folders">
      {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
      <Drawer
        variant="temporary"
        open={isMobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, overflow: "hidden" }
        }}
        PaperProps={{
          sx: {
            border: "none"
          }
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, overflow: "hidden" }
        }}
        PaperProps={{
          sx: {
            border: "none"
          }
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};
