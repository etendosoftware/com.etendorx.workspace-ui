import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Layout } from "./components/Layout";
import { SystemStatusSection } from "./components/SystemStatusSection";
import { InstallationSection } from "./components/InstallationSection";
import { DevelopmentSection } from "./components/DevelopmentSection";
import type { NavigationSection } from "./types/navigation";

const theme = createTheme({
  palette: {
    primary: {
      main: "#004aca",
      light: "#e3f2fd",
      dark: "#003494",
    },
    secondary: {
      main: "#7c3aed",
    },
    success: {
      main: "#4caf50",
      light: "#e8f5e9",
    },
    warning: {
      main: "#ff9800",
      light: "#fff3e0",
    },
    error: {
      main: "#f44336",
      light: "#ffebee",
    },
    background: {
      default: "#f5f6fa",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default function App() {
  const [activeSection, setActiveSection] = useState<NavigationSection>("system-status");

  const renderSection = () => {
    switch (activeSection) {
      case "system-status":
        return <SystemStatusSection />;
      case "installation":
        return <InstallationSection />;
      case "development":
        return <DevelopmentSection />;
      default:
        return <SystemStatusSection />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout activeSection={activeSection} onSectionChange={setActiveSection}>
        {renderSection()}
      </Layout>
    </ThemeProvider>
  );
}
