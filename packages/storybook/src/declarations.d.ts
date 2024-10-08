import { PaletteColor } from '@mui/material';

declare module '@mui/material/styles' {
  interface PaletteOptions {
    tertiary?: PaletteColor;
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
