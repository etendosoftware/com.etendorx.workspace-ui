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
 * Default sort of a grid, mirroring classic `OBViewGridComponent` + `ob-view-grid.js`: the tab's HQL
 * order-by clause is sent untouched as `_orderBy` (the server parses columns, `-`/`desc`, aliases and
 * expressions) and `_sortBy` only carries the sorts the user chose. Parsing the clause here is only
 * needed to show the sort indicator on the columns it resolves to.
 */

import { SORT_DESC_PREFIX, SORT_FIELD_SEPARATOR, type GroupingSort } from "./grouping";

/** Datasource parameter with the tab order-by clause (classic `OB.Constants.ORDERBY_PARAMETER`). */
export const ORDER_BY_PARAM = "_orderBy";
/** Alias of the main entity in HQL order-by clauses (e.g. `e.documentNo desc`). */
export const ENTITY_ALIAS_PREFIX = "e.";

const DESC_KEYWORD = "desc";
const ORDER_DIRECTIONS: ReadonlySet<string> = new Set(["asc", DESC_KEYWORD]);
const OPEN_PARENTHESIS = "(";
const CLOSE_PARENTHESIS = ")";
const WHITESPACE = /\s+/;
/** A plain property path: anything else (functions, operators) is an expression. */
const PROPERTY_PATH = /^[\w$.]+$/;
const TRUE_VALUE = "true";

/** Field attributes used to resolve the default sort of a tab. */
export interface DefaultSortField {
  name: string;
  hqlName?: string;
  columnName?: string;
  recordSortNo?: number | null;
  sequenceNumber?: number;
  column?: { isIdentifier?: unknown; identifier?: unknown } | null;
}

/** Tab attributes used to resolve its default sort. */
export interface DefaultSortTab {
  hqlorderbyclause?: string;
  sQLOrderByClause?: string;
  fields: Record<string, DefaultSortField>;
}

/**
 * Splits an order-by clause by its top-level commas, so `coalesce(a, b)` stays a single token.
 *
 * @param clause - Order-by clause, e.g. `accountingDate, abs(debit) desc`
 */
export const splitOrderByClause = (clause: string): string[] => {
  const tokens: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of clause) {
    if (char === OPEN_PARENTHESIS) {
      depth++;
    } else if (char === CLOSE_PARENTHESIS) {
      depth--;
    }
    if (char === SORT_FIELD_SEPARATOR && depth === 0) {
      tokens.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  tokens.push(current);
  return tokens.map((token) => token.trim()).filter(Boolean);
};

/**
 * Parses one order-by token: a `-` prefix or an `asc`/`desc` suffix sets the direction and the main
 * entity alias is dropped.
 *
 * @param token - Token of an order-by clause, e.g. `-accountingDate` or `e.documentNo desc`
 * @returns The property path and direction, or `null` when the token is an expression
 */
export const parseOrderByToken = (token: string): GroupingSort | null => {
  let path = token.trim();
  let desc = false;
  if (path.startsWith(SORT_DESC_PREFIX)) {
    desc = true;
    path = path.slice(SORT_DESC_PREFIX.length);
  }
  const parts = path.split(WHITESPACE);
  if (parts.length === 2 && ORDER_DIRECTIONS.has(parts[1].toLowerCase())) {
    desc = parts[1].toLowerCase() === DESC_KEYWORD;
    path = parts[0];
  }
  if (path.startsWith(ENTITY_ALIAS_PREFIX)) {
    path = path.slice(ENTITY_ALIAS_PREFIX.length);
  }
  if (!PROPERTY_PATH.test(path)) {
    return null;
  }
  return { id: path, desc };
};

/**
 * Finds the field an order-by property refers to.
 *
 * @param fields - Fields of the tab
 * @param path - Property path, column name or field name
 */
export const findOrderByField = <T extends DefaultSortField>(fields: readonly T[], path: string): T | undefined =>
  fields.find((field) => field.hqlName === path || field.columnName === path || field.name === path);

/**
 * Resolves an order-by clause to the grid columns it sorts, in priority order. Tokens that do not map to a
 * field (expressions, aliases of query-based tabs, nested paths) are skipped: the server still applies them
 * through `_orderBy`.
 *
 * @param clause - Order-by clause of the tab
 * @param fields - Fields of the tab
 */
export const resolveOrderBySorts = (clause: string, fields: readonly DefaultSortField[]): GroupingSort[] => {
  const sorts: GroupingSort[] = [];
  for (const token of splitOrderByClause(clause)) {
    const sort = parseOrderByToken(token);
    const field = sort ? findOrderByField(fields, sort.id) : undefined;
    if (sort && field && !sorts.some((existing) => existing.id === field.name)) {
      sorts.push({ id: field.name, desc: sort.desc });
    }
  }
  return sorts;
};

/**
 * Legacy resolution of a SQL order-by clause: only its first token, matched to a field when possible.
 *
 * @param clause - SQL order-by clause of the tab
 * @param fields - Fields of the tab
 */
const resolveSqlOrderBySort = (clause: string, fields: readonly DefaultSortField[]): GroupingSort => {
  const parts = clause.trim().split(WHITESPACE);
  const fieldName = parts[0];
  const desc = parts.length > 1 && parts[1].toLowerCase() === DESC_KEYWORD;
  return { id: findOrderByField(fields, fieldName)?.name ?? fieldName, desc };
};

const isTrueFlag = (value: unknown): boolean => value === true || value === TRUE_VALUE;

const isIdentifierField = (field: DefaultSortField): boolean =>
  isTrueFlag(field.column?.isIdentifier) || isTrueFlag(field.column?.identifier);

/**
 * Field-level default sort when the tab has no order-by clause: the lowest record sort number, otherwise
 * the first identifier field.
 *
 * @param fields - Fields of the tab
 */
const findFieldDefaultSort = (fields: readonly DefaultSortField[]): DefaultSortField | undefined => {
  const sortNoFields = fields.filter((field) => field.recordSortNo != null);
  if (sortNoFields.length > 0) {
    return sortNoFields.toSorted((a, b) => (a.recordSortNo ?? 0) - (b.recordSortNo ?? 0))[0];
  }
  return fields
    .filter(isIdentifierField)
    .toSorted((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0))[0];
};

/**
 * Default sorts of a tab: the columns of its HQL order-by clause, otherwise the first token of its SQL
 * order-by clause, otherwise the field-level default (record sort number or identifier).
 *
 * @param tab - Tab metadata
 */
export const resolveTabDefaultSorts = (tab: DefaultSortTab | undefined): GroupingSort[] => {
  if (!tab) {
    return [];
  }
  const fields = Object.values(tab.fields ?? {});
  if (tab.hqlorderbyclause) {
    return resolveOrderBySorts(tab.hqlorderbyclause, fields);
  }
  if (tab.sQLOrderByClause) {
    return [resolveSqlOrderBySort(tab.sQLOrderByClause, fields)];
  }
  const field = findFieldDefaultSort(fields);
  if (field) {
    return [{ id: field.name, desc: false }];
  }
  return [];
};

const isSameSort = (sort: GroupingSort, other: GroupingSort | undefined): boolean =>
  sort.id === other?.id && Boolean(sort.desc) === Boolean(other?.desc);

/**
 * Whether the grid is still sorted by the tab default (no sort, or exactly the default sorts), so the
 * request can rely on the order-by clause alone.
 *
 * @param current - Current sorts of the grid
 * @param defaults - Default sorts of the tab
 */
export const isDefaultSortingActive = (
  current: readonly GroupingSort[],
  defaults: readonly GroupingSort[]
): boolean => {
  if (current.length === 0) {
    return true;
  }
  return current.length === defaults.length && current.every((sort, index) => isSameSort(sort, defaults[index]));
};
