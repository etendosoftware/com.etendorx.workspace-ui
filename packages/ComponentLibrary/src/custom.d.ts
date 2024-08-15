import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    dynamicColor: PaletteColor;
    baselineColor: {
      neutral: { [key: number]: string };
      transparentNeutral: { [key: number]: string };
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
      neutral?: { [key: number]: string };
      transparentNeutral?: { [key: number]: string };
      etendoPrimary?: PaletteColorOptions;
    };
    specificColor?: {
      success?: PaletteColorOptions;
      warning?: PaletteColorOptions;
      error?: PaletteColorOptions;
      draft?: PaletteColorOptions;
    };
    tertiary?: PaletteColorOptions;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    tertiary: true;
  }
  interface ButtonClasses {
    containedTertiary: string;
  }
}
