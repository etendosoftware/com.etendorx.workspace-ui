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
import { type Theme, useTheme, type SxProps } from "@mui/material";

type StylesType = {
  sx: {
    container: SxProps<Theme>;
    button: (isActive?: boolean) => SxProps<Theme>;
  };
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        container: {
          padding: "0.5rem",
        },
        button: (isActive?: boolean) => ({
          color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
          backgroundColor: isActive ? theme.palette.background.default : theme.palette.action.disabled,
          borderRadius: "0.5rem",
          border: `1px solid ${theme.palette.divider}`,
          padding: theme.spacing(1),
          transition: theme.transitions.create(["color", "background-color"], {
            duration: theme.transitions.duration.short,
          }),
          "&:hover": {
            borderRadius: "0.5rem",
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.baselineColor.neutral[20],
          },
        }),
      },
    }),
    [theme]
  );
};
