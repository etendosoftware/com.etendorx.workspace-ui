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

import { useTheme } from "@mui/material";
import { useMemo } from "react";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        sectionContent: {
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        },
        sectionBox: (isLast: boolean) => ({
          borderBottom: isLast ? "none" : `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
        }),
        sectionInnerBox: {
          padding: "0.75rem",
          paddingBottom: "0.25rem",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        },
        contentWrapper: {
          borderRadius: "0.75rem",
        },
        sectionTitleContainer: {
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          marginBottom: "0.25rem",
          borderBottom: "1px solid transparent",
          "&:hover": {
            borderBottom: `1px solid ${theme.palette.baselineColor.etendoPrimary.main}`,
            cursor: "pointer",
          },
        },
        sectionTitle: {
          color: theme.palette.baselineColor.etendoPrimary.main,
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          fontWeight: 500,
        },
        arrowIcon: {
          rotate: "320deg",
          color: theme.palette.baselineColor.etendoPrimary.main,
          fontSize: "1rem",
        },
        itemsContainer: {
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        },
      },
    }),
    [theme]
  );
};
