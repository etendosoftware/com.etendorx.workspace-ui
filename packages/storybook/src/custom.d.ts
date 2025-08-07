/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
