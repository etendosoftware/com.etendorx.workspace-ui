'use client';

import { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { themeOptions } from '../../theme';

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [theme] = useState(() => createTheme(themeOptions));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
