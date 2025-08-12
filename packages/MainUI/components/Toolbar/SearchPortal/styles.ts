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
import { useTheme } from "@mui/material";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        portal: {
          position: "fixed",
          top: "5.5rem",
          right: "0.5rem",
          backgroundColor: theme.palette.baselineColor.neutral[0],
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          borderRadius: "1.5rem",
          padding: "0.25rem",
          width: "20rem",
          zIndex: 9999,
        },
      },
    }),
    [theme]
  );
};
