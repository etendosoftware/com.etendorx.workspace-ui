import '@mui/material/styles';

declare module '*.svg?react' {
  import React from 'react';
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

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
