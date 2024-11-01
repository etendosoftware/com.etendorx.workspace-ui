'use client';

import { createTheme, ThemeOptions } from '@mui/material';
export type * from '../custom';

// Colors for MUI attributes
export const PRIMARY_100 = '#D8DBF6';
export const PRIMARY_500 = '#202452';
export const SECONDARY_100 = '#FEFACF';
export const SECONDARY_300 = '#FDEC71';
export const SECONDARY_500 = '#FAD614';
export const TERTIARY_50 = '#EDF1FF';
export const TERTIARY_100 = '#E2E7FF';
export const TERTIARY_900 = '#151C7A';
export const NEUTRAL_50 = '#FAFAFA';
export const NEUTRAL_300 = '#E0E0E0';
export const NEUTRAL_1000 = '#121212';

export const themeOptions: ThemeOptions = {
  palette: {
    dynamicColor: {
      main: '#004ACA',
      dark: '#00296F',
      light: '#D5E3FC',
      contrastText: '#E5EFFF',
    },
    baselineColor: {
      neutral: {
        0: '#FCFCFD',
        10: '#F5F6FA',
        20: '#D3D7E9',
        30: '#B1B8D8',
        40: '#8F99C7',
        50: '#6D7AB6',
        60: '#505EA0',
        70: '#3F4A7E',
        80: '#2E365C',
        90: '#1D223A',
        100: '#00030D',
      },
      transparentNeutral: {
        0: 'transparent',
        5: 'rgba(0, 3, 13, 0.05)',
        10: 'rgba(0, 3, 13, 0.1)',
        20: 'rgba(0, 3, 13, 1)',
        30: 'rgba(0, 3, 13, 0.3)',
        40: 'rgba(0, 3, 13, 0.4)',
        50: 'rgba(0, 3, 13, 0.5)',
        60: 'rgba(0, 3, 13, 0.6)',
        70: 'rgba(0, 3, 13, 0.7)',
        80: 'rgba(0, 3, 13, 0.8)',
      },
      etendoPrimary: {
        main: '#004ACA',
        dark: '#00296F',
        contrastText: '#E5EFFF',
        light: ' rgba(0, 74, 202, 0.05)',
      },
    },
    specificColor: {
      success: {
        main: '#008000',
        light: '#BFFF8F',
        contrastText: 'rgba(0, 128, 0, 0.05)',
      },
      warning: {
        main: '#FFCC00',
        light: '#FFEB99',
        contrastText: 'rgba(255, 204, 0, 0.05)',
      },
      error: {
        main: '#DC143C',
        light: '#FFCCD6',
        contrastText: 'rgba(220, 20, 60, 0.05)',
      },
      draft: {
        main: '#3F4A7E',
        contrastText: '#E5E5E6',
      },
    },
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
    fontFamily: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"'].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        * {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: #b0bec5 transparent; /* Firefox */
        }
        *::-webkit-scrollbar {
          width: 12px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background-color: #b0bec5;
          border-radius: 10px;
          border: 3px solid transparent;
        }
        *::-webkit-scrollbar-thumb:hover {
          background-color: #90a4ae;
        }
      `,
    },
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
};

// Theme for MUI components
export const theme = createTheme(themeOptions);
