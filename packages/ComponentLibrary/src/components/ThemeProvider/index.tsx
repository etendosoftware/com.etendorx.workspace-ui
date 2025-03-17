import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '../../theme';

export default function ThemeProvider({ children }: React.PropsWithChildren) {
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
