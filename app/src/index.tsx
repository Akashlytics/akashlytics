import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import {App} from "./components/App";
import reportWebVitals from "./reportWebVitals";
import { IntlProvider } from "react-intl";
import { SnackbarProvider } from "notistack";
import MediaQueryProvider from "./context/MediaQueryProvider";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { BrowserRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

const theme = createMuiTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#e41e13"
    }
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
  },
});

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <IntlProvider locale={navigator.language}>
        <HelmetProvider>
          <SnackbarProvider maxSnack={3} dense hideIconVariant>
            <MediaQueryProvider>
              <Router>
                <App />
              </Router>
            </MediaQueryProvider>
          </SnackbarProvider>
        </HelmetProvider>
      </IntlProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);