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

import type { SxProps, Theme } from "@mui/material";

/** Styles of the window grid (`components/Table/styles.ts`), shared with the grids of process modals. */
export type GridSx = Record<string, SxProps<Theme>>;

/** The window grid sits inside a panel; in a modal the grid stands alone, so its frame is closed on every side. */
export const PROCESS_GRID_FRAME_SX = {
  border: "1px solid var(--color-transparent-neutral-10)",
  // The window grid sets its own left line; it is restated so the four sides match.
  borderLeft: "1px solid var(--color-transparent-neutral-10)",
  borderRadius: "0.75rem",
} as const;

/**
 * Icon buttons of the bar above a process grid: 32px round buttons in the ink of the window toolbar, filled with
 * the accent on hover, like the toolbar icons of the window grid.
 */
export const GRID_BAR_BUTTON_SX = {
  width: "2rem",
  height: "2rem",
  color: "var(--color-baseline-70)",
  "&:hover": { backgroundColor: "var(--color-dynamic-main)", color: "var(--color-baseline-0)" },
  "&.Mui-disabled": { color: "var(--color-transparent-neutral-30)" },
} as const;

/** Bar above a process grid: card surface with the soft line of the grid, instead of a grey band. */
export const GRID_BAR_CLASSES =
  "flex items-center justify-between border-b border-(--ui-line-soft) bg-(--ui-card-bg) h-[2.5rem] text-(--ui-text)";

/**
 * Styles a process grid with the ones of the window grid: two-band header (labels and filters), 32px rows,
 * column actions shown on hover, empty filters at rest and the selected row colour.
 *
 * @param sx styles of the window grid
 * @param height fixed height of the grid in the modal, in px (the window grid fills its panel instead)
 * @returns the sx of each part of the table
 */
export const getProcessGridSx = (sx: GridSx, height: number) => ({
  paper: {
    ...(sx.tablePaper as object),
    ...PROCESS_GRID_FRAME_SX,
    // The window grid grows into its panel (`flex: 1`, zero basis); in the modal that collapsed the grid to its
    // rows, so the fixed height applies as is.
    flex: "none",
    height: `${height}px`,
    maxHeight: `${height}px`,
  } as SxProps<Theme>,
  headCell: sx.tableHeadCell,
  bodyCell: sx.tableBodyCell,
  body: sx.tableBody,
});

/**
 * Row style of a process grid: the selected colour of the window grid, nothing for other rows.
 *
 * @param sx styles of the window grid
 * @param isSelected whether the row is selected
 * @returns the row sx
 */
export const getProcessGridRowSx = (sx: GridSx, isSelected: boolean): SxProps<Theme> | undefined =>
  isSelected ? sx.rowSelected : undefined;
