import { createTheme } from '@mui/material/styles';
import {
  NEUTRAL_300,
  NEUTRAL_50,
  NEUTRAL_1000,
  PRIMARY_100,
  PRIMARY_500,
  SECONDARY_100,
  SECONDARY_300,
  SECONDARY_500,
  TERTIARY_100,
  TERTIARY_50,
  TERTIARY_900,
} from './colors';

export const theme = createTheme({
  palette: {
    primary: {
      light: PRIMARY_100,
      main: PRIMARY_500,
      dark: TERTIARY_900,
      contrastText: NEUTRAL_50,
    },
    secondary: {
      light: SECONDARY_100,
      main: SECONDARY_500,
      dark: SECONDARY_300,
      contrastText: PRIMARY_500,
    },
    tertiary: {
      light: TERTIARY_50,
      main: TERTIARY_50,
      dark: TERTIARY_100,
      contrastText: PRIMARY_500,
    },
  },
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.875rem',
          backgroundColor: NEUTRAL_1000,
          color: NEUTRAL_50,
          borderRadius: '0.25rem',
          padding: '0.25rem, 0.35rem, 0.25rem, 0.35rem',
          maxWidth: 500,
        },
        arrow: {
          color: NEUTRAL_1000,
          '&::before': {
            borderRadius: '0.1rem',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          ':disabled': {
            backgroundColor: NEUTRAL_300,
          },
        },
        containedSecondary: {
          ':disabled': {
            backgroundColor: SECONDARY_100,
          },
        },
        containedTertiary: {
          color: PRIMARY_500,
          ':disabled': {
            backgroundColor: TERTIARY_50,
          },
        },
        // Styles applied to the root element if `variant="outlined"`.
        outlined: {
          borderWidth: 1.5,
          borderColor: PRIMARY_500,
          color: PRIMARY_500,
          '&:hover': {
            borderColor: PRIMARY_500,
            color: NEUTRAL_50,
            backgroundColor: PRIMARY_500,
          },
          ':disabled': {
            borderWidth: 1.5,
            borderColor: NEUTRAL_300,
          },
        },
        // Styles applied to the root element if `variant="text"`.
        text: {
          color: PRIMARY_500,
          '&:hover': {
            borderRadius: 0,
            borderBottom: `1.5px solid ${PRIMARY_500}`,
            backgroundColor: 'transparent',
          },
          ':disabled': {
            color: NEUTRAL_300,
          },
        },
      },
    },
    MuiTab: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1rem',
          borderTopRightRadius: '.5rem',
          borderTopLeftRadius: '.5rem',
          backgroundColor: TERTIARY_50,

          [':hover']: {
            backgroundColor: NEUTRAL_50,
          },
          ':focus': {
            backgroundColor: NEUTRAL_50,
          },
          ':selected': {
            backgroundColor: NEUTRAL_50,
          },
        },
      },
    },
  },
});
