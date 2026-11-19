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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @fileoverview Right alignment of numeric columns, shared by every grid (window grids, selector modals and
 * process grids): the values and their header sit on the right, as in Classic.
 */

/** Header props of a numeric column: MRT lays the label out on the right. */
export const NUMERIC_HEADER_CELL_PROPS = { align: "right" } as const;

/** Content of a numeric cell, with digits of the same width so the values line up. */
export const NUMERIC_CELL_CLASSES = "block w-full text-right tabular-nums";
