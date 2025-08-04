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

import { type CSSProperties, useMemo } from "react";
import { useTheme } from "@mui/material";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        NavStyles: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          height: "100%",
        },
        LeftItems: {
          width: "22.75rem",
          height: "100%",
          padding: "0.25rem",
          borderRadius: "6.25rem",
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
        },
        RightItems: {
          height: "3rem",
          padding: "0.25rem",
          display: "flex",
          borderRadius: "6.25rem",
          background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
        },
        childBox: {
          display: "flex",
          gap: "0.25rem",
        },
      } as { [key: string]: CSSProperties },
    }),
    [theme]
  );
};
