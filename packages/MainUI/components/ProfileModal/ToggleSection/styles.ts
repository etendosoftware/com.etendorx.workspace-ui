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

type toggleSection = {
  [key: string]: CSSProperties;
};

export const useStyle = () => {
  const theme = useTheme();
  const defaultFill = theme.palette.baselineColor.neutral[60];

  const styles: toggleSection = {
    selectorListStyles: {
      padding: "0rem 1rem 0.75rem 1rem",
    },
    formStyle: {
      margin: "0rem 0rem 1rem 0rem",
    },
    labelStyles: {
      color: theme.palette.baselineColor.neutral[80],
      fontWeight: "600",
    },
    iconStyles: {
      paddingLeft: "0.5rem",
    },
    flagStyles: {
      fontSize: "1rem",
      color: theme.palette.baselineColor.neutral[100],
    },
  };

  return { styles, defaultFill };
};
