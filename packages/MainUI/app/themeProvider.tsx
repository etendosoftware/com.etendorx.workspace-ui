'use client';

import { createTheme, ThemeProvider as MUIThemeProvider, ThemeOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { themeOptions } from '@workspaceui/componentlibrary/theme';
import { useState } from 'react';

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(createTheme(themeOptions as ThemeOptions));

  return (
    <MUIThemeProvider theme={currentTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
