declare module '@mui/material/styles' {
  interface BaselineColor {
    neutral: { [key: number]: string };
    transparentNeutral: { [key: number]: string };
    etendoPrimary: PaletteColor;
  }

  interface SpecificColor {
    success: PaletteColor;
    warning: PaletteColor;
    error: PaletteColor;
    draft: PaletteColor;
  }

  interface Palette {
    dynamicColor: PaletteColor;
    baselineColor: BaselineColor;
    specificColor: SpecificColor;
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

  interface ThemeOptions {
    palette?: PaletteOptions;
  }
}

export {};
