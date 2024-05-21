

import { createTheme } from '@mui/material/styles';
import InterTTF from '../src/styles/fonts/Inter-Regular.ttf';

import {
  NEUTRAL_300,
  NEUTRAL_50,
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
  typography: {
    fontFamily: [
      'Inter',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('inter'), local('inter'), url(${InterTTF}) format('truetype');
          unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
        }
      `,
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
