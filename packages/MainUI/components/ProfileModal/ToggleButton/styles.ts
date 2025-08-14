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

import type { CSSProperties } from "react";
import { useTheme } from "@mui/material";

type StylesType = {
  [key: string]: CSSProperties;
};

export const useStyle = () => {
  const theme = useTheme();

  const styles: StylesType = {
    toggleContainerStyles: {
      display: "flex",
      padding: "0.25rem",
      justifyContent: "space-between",
      alignItems: "center",
      alignSelf: "stretch",
      borderRadius: "12.5rem",
      gap: "0.25rem",
      background: theme.palette.baselineColor.transparentNeutral[10],
    },
    toggleButtonStyles: {
      height: "2.5rem",
      padding: "0.75rem 1rem",
      cursor: "pointer",
      justifyContent: "center",
      alignItems: "center",
      flex: "1 0 0",
      border: "0px solid",
      borderRadius: "12.5rem",
    },
  };

  return { styles };
};
