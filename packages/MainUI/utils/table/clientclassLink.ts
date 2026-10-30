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

import type { Column } from "@workspaceui/api-client/src/api/types";
import { LegacyColumnFilterUtils } from "@workspaceui/api-client/src/utils/search-utils";

/** Classic level indicator cell component (`isc.OBLevelImg`). */
export const LEVEL_IMG_CLIENTCLASS = "OBLevelImg";

/** Classic `OBLevelImg.valuesList` default: a 0–4 scale. */
export const DEFAULT_LEVEL_VALUES: readonly unknown[] = [0, 1, 2, 3, 4];

/** A level resolved for an `OBLevelImg` cell: `level` filled steps out of `max`. */
export interface ResolvedLevel {
  level: number;
  max: number;
}

/**
 * Splits a Classic `clientclass` (e.g. `OBLevelImg {"valuesList":[…]}`) into
 * its component name and JSON properties, as `OB.Utilities.clientClassSplitProps`
 * does: everything from the first `{` is JSON (`{}` when invalid) and the name
 * loses its whitespace.
 */
export function splitClientclass(clientclass: string | null | undefined): {
  name: string;
  props: Record<string, unknown>;
} {
  const value = clientclass ?? "";
  const propsStart = value.indexOf("{");
  if (propsStart <= 0) {
    return { name: value.replace(/\s+/g, ""), props: {} };
  }
  let props: Record<string, unknown> = {};
  try {
    props = JSON.parse(value.substring(propsStart));
  } catch {
    props = {};
  }
  return { name: value.substring(0, propsStart).replace(/\s+/g, ""), props };
}

/** Whether the column's `clientclass` is the Classic level indicator (`OBLevelImg`). */
export function isLevelImgColumn(column: Column): boolean {
  return splitClientclass(column.clientclass).name === LEVEL_IMG_CLIENTCLASS;
}

/** The `valuesList` of an `OBLevelImg` column, or the Classic default scale. */
export function readLevelValues(column: Column): readonly unknown[] {
  const { valuesList } = splitClientclass(column.clientclass).props;
  return Array.isArray(valuesList) && valuesList.length > 0 ? valuesList : DEFAULT_LEVEL_VALUES;
}

/**
 * Resolves a cell value to its level, as Classic `OBLevelImg.setValue` does:
 * the level is the value's position in `valuesList` (compared as strings) out
 * of `valuesList.length - 1`. An empty value or one missing from the list
 * shows nothing (`null`).
 */
export function resolveLevel(value: unknown, valuesList: readonly unknown[]): ResolvedLevel | null {
  if (!value) {
    return null;
  }
  const level = valuesList.findIndex((entry) => String(entry) === String(value));
  if (level < 0) {
    return null;
  }
  return { level, max: valuesList.length - 1 };
}

/**
 * Whether a grid column with a Classic `clientclass` renders as a navigation
 * link (e.g. `SalesOrderTabLink`). A Yes/No column is never a link: its
 * `clientclass` (e.g. `APRMMatchStatGridButtonsComponent`) is a cell component
 * the new UI does not render, so the column keeps its Yes/No cell and filter.
 * A level indicator (`OBLevelImg`) is not a link either: it has its own cell.
 */
export function isClientclassLinkColumn(column: Column): boolean {
  return Boolean(column.clientclass) && !LegacyColumnFilterUtils.isBooleanField(column) && !isLevelImgColumn(column);
}

/** Whether the column renders its own `clientclass` cell (a link or a level indicator). */
export function hasClientclassCell(column: Column): boolean {
  return isClientclassLinkColumn(column) || isLevelImgColumn(column);
}

/**
 * Whether the column's `clientclass` is a Classic cell component the new UI
 * does not render by itself (neither a link nor a level indicator), e.g.
 * `APRMMatchStatGridButtonsComponent`. Such a column hosts the script's row
 * buttons, as the component does in Classic.
 */
export function isClientclassComponentColumn(column: Column): boolean {
  return Boolean(column.clientclass) && !isClientclassLinkColumn(column) && !isLevelImgColumn(column);
}
