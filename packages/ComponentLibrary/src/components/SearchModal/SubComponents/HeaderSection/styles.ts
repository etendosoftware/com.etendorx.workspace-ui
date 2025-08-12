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

export const useStyle = () => {
  const theme = useTheme();

  return {
    styles: {
      headerSection: {
        display: "flex",
        padding: "0.75rem 1.25rem 0.75rem 0.75rem",
        alignItems: "center",
        backgroundColor: theme.palette.baselineColor.neutral[0],
      },
      searchIconContainer: {
        position: "relative",
        backgroundColor: theme.palette.baselineColor.etendoPrimary.contrastText,
        borderRadius: "12.5rem",
        width: "2rem",
        height: "2rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      },
      iconSearchStyles: {
        color: theme.palette.dynamicColor.main,
        height: "1.25rem",
        width: "1.25rem",
      },
      headerTitle: {
        fontSize: "1rem",
        color: theme.palette.baselineColor.neutral[90],
        marginLeft: 1,
        fontWeight: 600,
      },
    },
  };
};
