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

import { type SxProps, type Theme, useTheme } from "@mui/material";
import { useMemo } from "react";

type StylesType = {
  sx: Record<string, SxProps<Theme>>;
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        switch: {
          width: "2.5rem",
          height: "1.25rem",
          padding: 0,
          "& .MuiSwitch-switchBase": {
            padding: 0,
            margin: "0.125rem",
            transitionDuration: "300ms",
            "&.Mui-checked": {
              transform: "translateX(1.25rem)",
              color: theme.palette.baselineColor.neutral[0],
              "& + .MuiSwitch-track": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.specificColor.warning
                    : theme.palette.baselineColor.neutral[80],
                opacity: 1,
                border: 0,
              },
              "&.Mui-disabled + .MuiSwitch-track": {
                opacity: 0.5,
              },
            },
            "&.Mui-focusVisible .MuiSwitch-thumb": {
              color: theme.palette.specificColor.warning,
              border: `0.375rem solid ${theme.palette.baselineColor.neutral[0]}`,
            },
            "&.Mui-disabled .MuiSwitch-thumb": {
              color: theme.palette.mode === "light" ? theme.palette.grey[100] : theme.palette.grey[600],
            },
            "&.Mui-disabled + .MuiSwitch-track": {
              opacity: theme.palette.mode === "light" ? 0.7 : 0.3,
            },
          },
          "& .MuiSwitch-thumb": {
            boxSizing: "border-box",
            width: "1rem",
            height: "1rem",
            boxShadow: "none",
          },
          "& .MuiSwitch-track": {
            borderRadius: "1.625rem",
            backgroundColor:
              theme.palette.mode === "light"
                ? theme.palette.baselineColor.neutral[30]
                : theme.palette.specificColor.draft.contrastText,
            opacity: 1,
            transition: theme.transitions.create(["background-color"], {
              duration: 500,
            }),
          },
        },
      },
    }),
    [theme]
  );
};
