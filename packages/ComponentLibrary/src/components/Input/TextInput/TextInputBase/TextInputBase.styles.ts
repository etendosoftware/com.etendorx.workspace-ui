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

import { useMemo } from "react";
import { type SxProps, type Theme, useTheme } from "@mui/material";

type StylesType = {
  styles: { [key: string]: React.CSSProperties };
  sx: { [key: string]: SxProps<Theme> };
  cssString: string;
};

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () =>
      ({
        styles: {

          inputStyle: {
            padding: "0.25rem 0",
            fontSize: "14px",
            color: theme.palette.baselineColor.transparentNeutral[100],
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
          },
        } as { [key: string]: React.CSSProperties },

        sx: {
          inputAdornment: {
            paddingY: "4px",
          },
          inputBase: {
            "& .MuiInput-underline:before": {
              borderBottomWidth: "1px",
              borderBottomStyle: "solid",
            },
            "& .MuiInput-underline:hover:before": {
              borderBottomColor: theme.palette.baselineColor.neutral[80],
            },
            "& .MuiInput-underline:after": {
              borderBottomColor: theme.palette.baselineColor.neutral[80],
            },
            "& .MuiInputBase-input": {
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
            },
          },
        } as { [key: string]: SxProps<Theme> },

        cssString: `
        #password-input::placeholder {
          color: transparent;
        }
        #password-input-label {
          font-weight: 500;
          font-size: 18px;
          font-family: 'Inter', sans-serif;
        }
        .MuiFormLabel-root {
          color: ${theme.palette.baselineColor.neutral[80]};
        }
        .MuiFormLabel-root.Mui-focused {
          color: ${theme.palette.baselineColor.neutral[80]};
        }
        .MuiFormLabel-asterisk {
          color: ${theme.palette.specificColor.error.main};
        }
        #password-input {
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
        }
      `,
      }) satisfies StylesType,
    [theme]
  );
};
