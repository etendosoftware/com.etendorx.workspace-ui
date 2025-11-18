import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@workspaceui/componentlibrary/src/theme";

/**
 * Simple test provider wrapper for components that don't need complex context setup
 * Used primarily for E2E, Performance, and Accessibility tests
 */
export const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={theme} data-testid="ThemeProvider__93b3af">
      {children}
    </ThemeProvider>
  );
};
