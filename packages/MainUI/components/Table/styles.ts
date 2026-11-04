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
        tablePaper: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          height: "100%",
          maxHeight: "100%",
          border: "1px solid var(--ui-line)",
          borderRadius: "0.75rem",
          overflow: "hidden",
          // The sticky header row ships a drop shadow that smudges the filter band; the design has none.
          "& thead tr": {
            boxShadow: "none !important",
          },
        },
        // Two bands, like the reference: lavender label row on top, white filter row below. The bands are
        // painted on the cell itself so the pinned checkbox/actions columns get them too.
        tableHeadCell: {
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          // The column separator crosses both bands: darker lavender on the label band, soft gray on the filters.
          borderRight: "none",
          // Pinned columns ship their own top padding, which would misalign the two bands.
          padding: "0 !important",
          backgroundColor: "var(--ui-card-bg)",
          backgroundImage:
            "linear-gradient(var(--ui-head-sep), var(--ui-head-sep)), linear-gradient(var(--ui-line-soft), var(--ui-line-soft)), linear-gradient(to bottom, var(--ui-table-head-bg) 28px, var(--ui-card-bg) 28px)",
          backgroundSize: "1px 28px, 1px calc(100% - 28px), 100% 100%",
          backgroundPosition: "right top, right bottom, 0 0",
          backgroundRepeat: "no-repeat",
          fontWeight: 500,
          fontSize: "0.8rem",
          borderBottom: "1px solid var(--ui-line-soft)",
          color: theme.palette.text.primary,
          "&:last-child": {
            borderRight: "none",
          },
          // Funnel in the filter band of the checkbox column, like the column filter design.
          "&:has(.MuiCheckbox-root)::after": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            top: "28px",
            height: "28px",
            backgroundColor: "var(--ui-text)",
            maskImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M3 4h18l-7 8.5V20l-4-2v-5.5L3 4z'/></svg>\")",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "14px",
            pointerEvents: "none",
          },
          // With rows selected the funnel gives way to the number of selected rows (plain text in the checkbox color), like Classic.
          "[data-selected-count]:not([data-selected-count='0']) &:has(.MuiCheckbox-root)::after": {
            content: "var(--ui-selected-count)",
            left: 0,
            right: 0,
            top: "28px",
            height: "28px",
            minWidth: 0,
            padding: 0,
            transform: "none",
            backgroundColor: "transparent",
            // Same color as the checked checkboxes (theme primary), so count and checks read as one.
            color: theme.palette.primary.main,
            fontSize: "13px",
            fontWeight: 700,
            lineHeight: "28px",
            textAlign: "center",
            maskImage: "none",
          },
          // Pinned cells ship a near-white overlay that would wash the bands out.
          "&::before": {
            background: "none !important",
            // Last pinned column draws a shadow on its right edge; the design has none.
            boxShadow: "none !important",
          },
          "& .MuiBox-root": {
            whiteSpace: "nowrap",
          },
          // The checkbox column centers its check; the funnel below sits on the same axis.
          "&:has(.MuiCheckbox-root) .Mui-TableHeadCell-Content": {
            justifyContent: "center",
          },
          // The select-all wrapper reserves extra width for a badge; collapse it to the checkbox so it centers.
          "&:has(.MuiCheckbox-root) .Mui-TableHeadCell-Content-Wrapper": {
            width: "28px",
            minWidth: "0 !important",
          },
          "&:has(.MuiCheckbox-root) .Mui-TableHeadCell-Content-Actions, &:has(.MuiCheckbox-root) .Mui-TableHeadCell-ResizeHandle-Wrapper":
            {
              display: "none",
            },
          "& .Mui-TableHeadCell-Content": {
            boxSizing: "border-box",
            height: "28px",
            minHeight: 0,
            padding: "0 8px",
            alignItems: "center",
          },
          // Only the label is visible at rest: sort arrows, resize handle and column menu show on hover.
          "& .Mui-TableHeadCell-Content-Actions, & .Mui-TableHeadCell-ResizeHandle-Wrapper": {
            opacity: 0,
            transition: "opacity 0.15s",
          },
          "&:hover .Mui-TableHeadCell-Content-Actions, &:hover .Mui-TableHeadCell-ResizeHandle-Wrapper": {
            opacity: 1,
          },
          // Unsorted columns show a generic sort icon; a real sort direction stays visible at all times.
          "& .MuiTableSortLabel-icon[data-testid='SyncAltIcon']": {
            opacity: 0,
            transition: "opacity 0.15s",
          },
          "&:hover .MuiTableSortLabel-icon[data-testid='SyncAltIcon']": {
            opacity: 1,
          },
          // The filter field spans the whole cell; its inner padding (below) keeps text and chevron inset.
          "& .MuiCollapse-root": {
            padding: 0,
          },
          // Filter controls ship with a 40px height; keep the filter band as compact as the labels.
          "& .h-10": {
            height: "1.75rem !important",
            paddingTop: "0 !important",
            paddingBottom: "0 !important",
            paddingLeft: "8px !important",
            paddingRight: "8px !important",
            boxSizing: "border-box",
          },
          // Resting filters have no underline; an open selector keeps its full border (it has the `border` class).
          "& .h-10.border-b:not(.border)": {
            borderBottomWidth: 0,
          },
          "& .text-sm": {
            fontSize: "0.78rem",
          },
          // Filters are empty at rest, as in the reference; typing or opening them shows their content.
          "& input::placeholder": {
            color: "transparent",
          },
          "& .text-slate-400": {
            color: "transparent",
          },
        },
        tableBodyCell: {
          borderRight: "1px solid var(--ui-line-soft)",
          borderBottom: "1px solid var(--ui-line-soft)",
          padding: "2px 8px",
          fontSize: "0.78rem",
          lineHeight: 1.35,
          "& .text-sm": {
            fontSize: "0.78rem",
          },
          "&:first-of-type": {
            textAlign: "center",
          },
          "&:has(.MuiCheckbox-root)": {
            justifyContent: "center",
          },
          "&::before": {
            boxShadow: "none !important",
          },
        },
        tableBody: {
          "& tr": {
            backgroundColor: theme.palette.background.paper,
          },
          cursor: "pointer",
        },
        // multiselect
        multiSelectContainer: {
          display: "flex",
        },
        rowSelected: {
          cursor: "pointer",
          backgroundColor: "var(--ui-row-selected) !important",
          // material-react-table paints a dark overlay over selected cells; the row color is enough.
          "& td::after": { backgroundColor: "transparent !important" },
          "& td::before": { backgroundColor: "var(--ui-row-selected) !important" },
          "&:hover td::before": { backgroundColor: "var(--ui-row-selected-hover) !important" },
          "&:hover": {
            backgroundColor: "var(--ui-row-selected-hover) !important",
          },
        },
        contentContainer: {
          flex: 1,
        },
        titleContainer: {
          margin: "0.5rem",
        },
        selectedContainer: {
          borderRadius: "0.25rem 0 0 0.25rem",
          minHeight: "8rem",
          maxHeight: "8rem",
          overflow: "auto",
          background: theme.palette.baselineColor.neutral[20],
          borderBottom: `1px solid ${theme.palette.divider}`,
        },
        selectedItem: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.75rem",
          borderBottom: `1px solid ${theme.palette.baselineColor.neutral[10]}`,
        },
        selectedItemHover: {
          backgroundColor: theme.palette.baselineColor.neutral[5],
        },
        emptyState: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: theme.palette.baselineColor.neutral[100],
        },
        searchBarBase: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          minWidth: "2rem",
          maxHeight: "8rem",
          borderRadius: "0 0.25rem 0.25rem 0",
          padding: "0.5rem 0.75rem",
          marginTop: "1.5rem",
          color: theme.palette.baselineColor.neutral[0],
          background: theme.palette.baselineColor.neutral[50],
        },
        clearButton: {
          background: theme.palette.baselineColor.neutral[10],
        },
        clearButtonHover: {
          background: theme.palette.baselineColor.neutral[50],
        },
        dialogContent: {
          padding: "1rem",
        },
      },
    }),
    [theme]
  );
};
