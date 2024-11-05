'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '../../theme';

export function ThemeRegistry({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
