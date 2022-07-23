import React, { ReactNode, useEffect, useState } from "react";
import PageHead from "./PageHead";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import { Sidebar } from "./Sidebar";
import { IntlProvider } from "react-intl";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "../shared/ErrorFallback";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { drawerWidth } from "@src/utils/constants";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";

type Props = {
  children?: ReactNode;
  title?: string;
  appendGenericTitle?: boolean;
};

const Layout: React.FunctionComponent<Props> = ({ children, title = "Cloudmos Block Explorer", appendGenericTitle }) => {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    if (navigator?.language) {
      setLocale(navigator?.language);
    }
  }, []);

  return (
    <IntlProvider locale={locale}>
      <LayoutApp title={`${title}${appendGenericTitle ? " | Cloudmos Block Explorer" : ""}`}>{children}</LayoutApp>
    </IntlProvider>
  );
};

const LayoutApp: React.FunctionComponent<Props> = ({ children, title }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        color: "text.primary"
      }}
    >
      <PageHead headTitle={title} />
      <Sidebar isMobileOpen={isMobileOpen} handleDrawerToggle={handleDrawerToggle} />

      <AppBar position="fixed" sx={{ display: { xs: "block", sm: "none" } }}>
        <Toolbar sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/">
            <Box component="a" sx={{ display: "flex", alignItems: "center", textDecoration: "none", textDecorationColor: "transparent !important" }}>
              <Image alt="Cloudmos Logo" src="/images/cloudmos-logo.png" quality={100} width={35} height={35} priority />
            </Box>
          </Link>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: "none" } }}>
            {isMobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          marginLeft: { xs: 0, sm: `${drawerWidth}px` },
          paddingTop: { xs: "56px", sm: 0 },
          height: "100%"
        }}
      >
        <SearchBar />
        <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
      </Box>
    </Box>
  );
};

export default Layout;
