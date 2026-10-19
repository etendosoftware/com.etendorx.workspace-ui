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

/**
 * Grid "group by column" helpers, mirroring classic `ob-view-grid.js` (`groupBy` / `clearGroupBy`).
 * Everything here is pure so the grid and its hooks only wire state around it.
 */

import { FieldType, type EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_ExpandedState } from "material-react-table";
import type { SummaryType } from "@/components/Table/HeaderContextMenu";
import { COLUMN_NAMES } from "@/components/Table/constants";
import { getStoredPreference } from "@/utils/propertyStore";
import type { TranslateFunction } from "@/hooks/types";

/** Preference that enables grouping for a window (classic `OB.PropertyStore.get('OBUIAPP_GroupingEnabled', windowId)`). */
export const GROUPING_ENABLED_PREFERENCE = "OBUIAPP_GroupingEnabled";
/** Preference that overrides the grouping record limit for a window. */
export const GROUPING_MAX_RECORDS_PREFERENCE = "OBUIAPP_GroupingMaxRecords";
/** Classic `groupByMaxRecords` default. */
export const DEFAULT_GROUPING_MAX_RECORDS = 1000;
const PREFERENCE_ENABLED_VALUE = "Y";

/** AD messages used by the classic grid for grouping. */
export const GROUP_BY_LABEL = "OBUIAPP_GroupBy";
export const UNGROUP_LABEL = "OBUIAPP_ungroup";
export const MAX_GROUPING_REACHED_LABEL = "OBUIAPP_MaxGroupingReached";

/** Local translation keys used when the backend does not provide the AD message. */
export const GROUPING_TRANSLATION_KEYS = {
  GROUP_BY: "table.groupBy",
  UNGROUP: "table.ungroup",
  MAX_GROUPING_REACHED: "table.maxGroupingReached",
} as const;

/** Columns that can never be grouped (selection, expand, actions and edit link). */
export const NON_GROUPABLE_COLUMN_IDS: readonly string[] = [
  "mrt-row-select",
  "mrt-row-expand",
  COLUMN_NAMES.ACTIONS,
  "_editLink",
];

/** Field types classic marks as `canGroupBy: false` (YesNo and Image UI definitions). */
const NON_GROUPABLE_FIELD_TYPES: readonly string[] = [FieldType.BOOLEAN, FieldType.IMAGE];

const IDENTIFIER_SUFFIX = "$_identifier";
const SORT_DESC_PREFIX = "-";
const SORT_FIELD_SEPARATOR = ",";

/** Placeholders of the classic (`${title}`, `%0`) and local (`{column}`, `{count}`) label templates. */
const TITLE_PLACEHOLDER = /\$\{title\}|\{column\}/g;
const COUNT_PLACEHOLDER = /%0|\{count\}/g;

export interface GroupingLabelValues {
  title?: string;
  count?: number;
}

export interface GroupingSort {
  id: string;
  desc: boolean;
}

interface GroupableColumn {
  id?: string;
  type?: unknown;
  columnDefType?: string;
}

/**
 * Whether the window allows grouping. Classic only groups when the preference is `Y`.
 *
 * @param windowId - AD window id
 */
export const isGroupingEnabled = (windowId?: string): boolean =>
  getStoredPreference(GROUPING_ENABLED_PREFERENCE, windowId) === PREFERENCE_ENABLED_VALUE;

/**
 * Record limit above which grouping is cleared. Uses the window preference when it holds a positive number.
 *
 * @param windowId - AD window id
 */
export const getGroupingMaxRecords = (windowId?: string): number => {
  const value = Number(getStoredPreference(GROUPING_MAX_RECORDS_PREFERENCE, windowId));
  if (Number.isInteger(value) && value > 0) {
    return value;
  }
  return DEFAULT_GROUPING_MAX_RECORDS;
};

/**
 * Whether a column can be used to group the grid.
 *
 * @param column - Column definition (data or display column)
 */
export const canGroupByColumn = (column?: GroupableColumn | null): boolean => {
  if (!column?.id || column.columnDefType === "display") {
    return false;
  }
  if (NON_GROUPABLE_COLUMN_IDS.includes(column.id)) {
    return false;
  }
  return !NON_GROUPABLE_FIELD_TYPES.includes(String(column.type));
};

/**
 * Whether the loaded records exceed the grouping limit (classic `data.getLength() > groupByMaxRecords`).
 */
export const exceedsGroupingLimit = (loadedCount: number, maxRecords: number): boolean => loadedCount > maxRecords;

const toSortToken = (field: string, desc: boolean): string => {
  if (desc) {
    return `${SORT_DESC_PREFIX}${field}`;
  }
  return field;
};

/**
 * Builds the datasource `sortBy` for a grouped grid: the grouped field first (so groups arrive in order)
 * and, when the user sorts by another column, that column next (so rows are sorted inside each group).
 *
 * @param groupField - Property (hqlName) of the grouped column
 * @param userSort - Current sort, with its id already resolved to a property, if any
 */
export const buildGroupedSortBy = (groupField: string, userSort?: GroupingSort | null): string => {
  if (!userSort) {
    return groupField;
  }
  if (userSort.id === groupField) {
    return toSortToken(groupField, userSort.desc);
  }
  return [groupField, toSortToken(userSort.id, userSort.desc)].join(SORT_FIELD_SEPARATOR);
};

/**
 * Raw value a record is grouped by (the id for foreign keys, so homonyms are not merged).
 *
 * @param record - Grid record
 * @param field - Property (hqlName) of the grouped column
 */
export const getGroupingValue = (record: EntityData | undefined, field: string): unknown => record?.[field] ?? null;

/**
 * Value shown in a group header: the identifier when the backend returns one, otherwise the raw value.
 *
 * @param record - Any record of the group
 * @param field - Property (hqlName) of the grouped column
 */
export const getGroupDisplayValue = (record: EntityData | undefined, field: string): string => {
  const value = record?.[`${field}${IDENTIFIER_SUFFIX}`] ?? record?.[field];
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
};

/**
 * Expanded state that opens only the first group, as the classic grid does when the grouping changes.
 * The id follows TanStack's grouped row id format: `${columnId}:${groupingValue}`.
 *
 * @param columnId - Grouped column id
 * @param firstRecord - First record of the (sorted) data
 * @param field - Property (hqlName) of the grouped column
 */
export const buildFirstGroupExpandedState = (
  columnId: string,
  firstRecord: EntityData | undefined,
  field: string
): MRT_ExpandedState => {
  if (!firstRecord) {
    return {};
  }
  return { [`${columnId}:${getGroupingValue(firstRecord, field)}`]: true };
};

const toNumbers = (values: unknown[]): number[] =>
  values.filter((value) => value !== null && value !== undefined && value !== "").map(Number);

const sum = (numbers: number[]): number => numbers.reduce((total, value) => total + value, 0);

const SUMMARY_CALCULATORS: Record<SummaryType, (numbers: number[]) => number | null> = {
  sum,
  avg: (numbers) => (numbers.length ? sum(numbers) / numbers.length : null),
  count: (numbers) => numbers.length,
  min: (numbers) => (numbers.length ? Math.min(...numbers) : null),
  max: (numbers) => (numbers.length ? Math.max(...numbers) : null),
};

/**
 * Computes a summary function over the raw values of a group's records (group subtotal).
 *
 * @param type - Summary function chosen for the column
 * @param records - Records of the group
 * @param field - Property (hqlName) of the summarized column
 */
export const aggregateSummary = (type: SummaryType, records: EntityData[], field: string): number | null =>
  SUMMARY_CALCULATORS[type](toNumbers(records.map((record) => record[field])));

/**
 * Replaces the classic/local placeholders of a grouping label.
 *
 * @param template - Label template
 * @param values - Column title and/or record count
 */
export const formatGroupingLabel = (template: string, values: GroupingLabelValues = {}): string => {
  let label = template;
  if (values.title !== undefined) {
    label = label.replace(TITLE_PLACEHOLDER, values.title);
  }
  if (values.count !== undefined) {
    label = label.replace(COUNT_PLACEHOLDER, String(values.count));
  }
  return label;
};

/**
 * Resolves a grouping label from the AD message (same text as classic, in the user's language), falling back
 * to the local translation when the backend does not provide it.
 *
 * @param getLabel - Backend label resolver (returns the key itself when unknown)
 * @param t - Local translation function
 * @param labelKey - AD message key
 * @param translationKey - Local translation key
 * @param values - Placeholder values
 */
export const resolveGroupingLabel = (
  getLabel: (key: string) => string,
  t: TranslateFunction,
  labelKey: string,
  translationKey: Parameters<TranslateFunction>[0],
  values?: GroupingLabelValues
): string => {
  let template = getLabel(labelKey);
  if (!template || template === labelKey) {
    template = t(translationKey);
  }
  return formatGroupingLabel(template, values);
};

/**
 * Column the grid is effectively grouped by: grouping is ignored in tree mode and when the window does not enable it.
 *
 * @param grouping - Stored grouping state
 * @param windowId - AD window id
 * @param isTreeMode - Whether the grid is showing the tree
 */
export const getActiveGroupColumnId = (
  grouping: readonly string[] | undefined,
  windowId: string | undefined,
  isTreeMode: boolean
): string | undefined => {
  if (isTreeMode || !grouping?.length || !isGroupingEnabled(windowId)) {
    return undefined;
  }
  return grouping[0];
};

/**
 * Whether a grid row is a group header row (a row built by grouping, not a record).
 *
 * @param row - Grid row; partial rows without grouping support are treated as records
 */
export const isGroupRow = (row: { getIsGrouped?: () => boolean }): boolean => row.getIsGrouped?.() === true;
