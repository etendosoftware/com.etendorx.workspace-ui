import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import App from "./App";
import "./styles.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#202452",
    },
    secondary: {
      main: "#004ACA",
    },
    background: {
      default: "#f5f6fa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: ["Inter", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"].join(","),
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
