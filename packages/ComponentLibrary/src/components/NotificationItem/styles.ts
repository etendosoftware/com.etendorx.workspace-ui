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
import { type SxProps, type Theme, useTheme } from "@mui/material";

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        iconContainerStyles: {
          width: "2.25rem",
          height: "2.25rem",
          display: "flex",
          justifyContent: "center",
          alignContent: "center",
          flexWrap: "wrap",
          background: theme.palette.dynamicColor.contrastText,
          borderRadius: "100%",
        },
        textContainerStyles: {
          marginLeft: "0.5rem",
          width: "22.25rem",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        descriptionStyles: {
          fontSize: "0.875rem",
          fontWeight: "500",
          lineHeight: "1.25rem",
        },
        ctaButtonContainer: {
          marginTop: "10px",
          display: "flex",
          gap: "10px",
        },
        dateContainer: {
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        },
        dateStyles: {
          fontSize: "0.75rem",
          fontWeight: "500",
          marginTop: "0.25rem",
        },
        anchorStyles: {
          fontSize: "0.875rem",
          fontWeight: "500",
          lineHeight: "1.063rem",
          color: theme.palette.dynamicColor.main,
          textDecoration: "none",
        },
      } as { [key: string]: CSSProperties },
      sx: {
        listItem: {
          padding: 0,
        },
        notificationBox: {
          width: "27.25rem",
          borderRadius: "0.75rem",
          margin: "0.25rem 0.75rem",
          padding: "0.75rem 1rem",
          display: "flex",
          backgroundColor: theme.palette.baselineColor.neutral[0],
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          "&:hover": {
            backgroundColor: theme.palette.baselineColor.neutral[10],
            outline: `2px solid ${theme.palette.dynamicColor.main}`,
            "& .closeIcon": {
              visibility: "visible",
            },
            "& > .textContainer": {
              paddingRight: "1.5rem",
            },
          },
        },
        closeIconButton: {
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          visibility: "hidden",
          "& .closeIcon": {
            fill: theme.palette.baselineColor.neutral[80],
            width: "1rem",
            height: "1rem",
          },
        },
        leftButton: {
          background: theme.palette.baselineColor.transparentNeutral[10],
          color: theme.palette.baselineColor.transparentNeutral[70],
          height: "2rem",
          borderRadius: "6.25rem",
          padding: "0.5rem 1rem",
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          "&:hover": {
            border: "none",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[10],
          },
        },
        rightButton: {
          background: theme.palette.baselineColor.neutral[100],
          color: theme.palette.baselineColor.neutral[0],
          height: "2rem",
          borderRadius: "6.25rem",
          padding: "0.5rem 1rem",
          "&:hover": {
            border: "none",
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[10],
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme]
  );
};
