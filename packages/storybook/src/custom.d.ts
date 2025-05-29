import { PaletteOptions, Palette, type PaletteColor } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    dynamicColor: PaletteColor;
    baselineColor: {
      neutral: {
        [key: string]: string;
      };
      transparentNeutral: {
        [key: string]: string;
      };
      etendoPrimary: PaletteColor;
    };
    specificColor: {
      success: PaletteColor;
      warning: PaletteColor;
      error: PaletteColor;
      draft: PaletteColor;
    };
  }
  interface PaletteOptions {
    dynamicColor?: PaletteColorOptions;
    baselineColor?: {
      neutral?: {
        [key: string]: string;
      };
      transparentNeutral?: {
        [key: string]: string;
      };
      etendoPrimary?: PaletteColorOptions;
    };
    specificColor?: {
      success?: PaletteColorOptions;
      warning?: PaletteColorOptions;
      error?: PaletteColorOptions;
      draft?: PaletteColorOptions;
    };
  }
}

interface PaletteColorOptions {
  main: string;
  dark?: string;
  light?: string;
  contrastText?: string;
}

interface PaletteColor {
  main: string;
  dark?: string;
  light?: string;
  contrastText?: string;
}
