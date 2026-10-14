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

import type { BaseCriteria } from "../api/types";

/**
 * Parser for the classic numeric column filter grammar (SmartClient `parseValueExpressions`
 * as used by `OBNumberFilterItem`). Handles a single term; the `and`/`or` split is done by
 * the caller.
 */

export const NUMERIC_OPERATORS = {
  EQUALS: "equals",
  NOT_EQUAL: "notEqual",
  GREATER_THAN: "greaterThan",
  LESS_THAN: "lessThan",
  GREATER_OR_EQUAL: "greaterOrEqual",
  LESS_OR_EQUAL: "lessOrEqual",
  BETWEEN_INCLUSIVE: "betweenInclusive",
  IS_NULL: "isNull",
} as const;

/** Comparison symbols ordered longest first, so `>=` wins over `>`. */
const COMPARISON_PREFIXES: ReadonlyArray<{ prefix: string; operator: string }> = [
  { prefix: ">=", operator: NUMERIC_OPERATORS.GREATER_OR_EQUAL },
  { prefix: "<=", operator: NUMERIC_OPERATORS.LESS_OR_EQUAL },
  { prefix: "==", operator: NUMERIC_OPERATORS.EQUALS },
  { prefix: ">", operator: NUMERIC_OPERATORS.GREATER_THAN },
  { prefix: "<", operator: NUMERIC_OPERATORS.LESS_THAN },
  { prefix: "=", operator: NUMERIC_OPERATORS.EQUALS },
  { prefix: "!", operator: NUMERIC_OPERATORS.NOT_EQUAL },
];

/** SmartClient expression symbols whose operators the classic numeric filter rejects. */
const UNSUPPORTED_NUMERIC_PREFIXES = ["!=(", "!~", "!^", "!@", "!#", "=(", "=.", "~", "^", "/"];

/** Wildcard that SmartClient turns into a `matchesPattern` criterion. */
const PATTERN_WILDCARD = "*";

export const RANGE_SEPARATOR = "...";
export const NULL_SYMBOL = "#";

/** AD reference ids of numeric columns: Integer, Amount, Number, Quantity, Price, General Quantity. */
export const NUMERIC_REFERENCE_CODES = ["11", "12", "22", "29", "800008", "800019"];

export interface NumericFilterFormat {
  decimalSymbol: string;
  groupingSymbol: string;
}

const DEFAULT_NUMERIC_FILTER_FORMAT: NumericFilterFormat = { decimalSymbol: ".", groupingSymbol: "," };

let currentNumericFilterFormat: NumericFilterFormat = DEFAULT_NUMERIC_FILTER_FORMAT;

/** Sets the user's number format used to read numeric filter values. */
export function setNumericFilterFormat(format: NumericFilterFormat): void {
  currentNumericFilterFormat = { ...format };
}

export function getNumericFilterFormat(): NumericFilterFormat {
  return currentNumericFilterFormat;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function buildNumberPattern(format: NumericFilterFormat): RegExp {
  const group = escapeRegExp(format.groupingSymbol);
  const decimal = escapeRegExp(format.decimalSymbol);
  return new RegExp(`^[+-]?(?:\\d+(?:${group}\\d{3})*)?(?:${decimal}\\d+)?$`);
}

/**
 * Parses a number typed with the user's decimal and grouping symbols (e.g. `1.234,56`).
 * Returns null when the text is not a valid number in that format.
 */
export function parseLocaleNumber(text: string, format: NumericFilterFormat = getNumericFilterFormat()): number | null {
  const value = text.trim();
  if (!/\d/.test(value) || !buildNumberPattern(format).test(value)) {
    return null;
  }
  const plain = value.split(format.groupingSymbol).join("").replace(format.decimalSymbol, ".");
  return Number(plain);
}

/** True when the term uses an expression operator that numeric columns do not support. */
export function isUnsupportedNumericTerm(term: string): boolean {
  const value = term.trim();
  return value.includes(PATTERN_WILDCARD) || UNSUPPORTED_NUMERIC_PREFIXES.some((prefix) => value.startsWith(prefix));
}

function buildNullCriteria(fieldName: string): BaseCriteria {
  return { fieldName, operator: NUMERIC_OPERATORS.IS_NULL, value: undefined };
}

function buildRangeCriteria(fieldName: string, term: string, format: NumericFilterFormat): BaseCriteria | null {
  const limits = term.split(RANGE_SEPARATOR);
  if (limits.length !== 2) {
    return null;
  }
  const start = parseLocaleNumber(limits[0], format);
  const end = parseLocaleNumber(limits[1], format);
  if (start === null || end === null) {
    return null;
  }
  return { fieldName, operator: NUMERIC_OPERATORS.BETWEEN_INCLUSIVE, value: undefined, start, end };
}

function buildComparisonCriteria(fieldName: string, term: string, format: NumericFilterFormat): BaseCriteria | null {
  const match = COMPARISON_PREFIXES.find(({ prefix }) => term.startsWith(prefix));
  let operator: string = NUMERIC_OPERATORS.EQUALS;
  let rawValue = term;
  if (match) {
    operator = match.operator;
    rawValue = term.substring(match.prefix.length);
  }
  const value = parseLocaleNumber(rawValue, format);
  if (value === null) {
    return null;
  }
  return { fieldName, operator, value };
}

/**
 * Builds the datasource criterion for a single numeric filter term, mirroring the classic UI:
 * `#` → isNull, `a...b` → betweenInclusive, `>`/`<`/`>=`/`<=`/`=`/`==`/`!` → comparisons and
 * a bare number → equals. Returns null for incomplete, invalid or unsupported terms.
 */
export function parseNumericTerm(
  fieldName: string,
  term: string,
  format: NumericFilterFormat = getNumericFilterFormat()
): BaseCriteria | null {
  const value = term.trim();
  if (!value || isUnsupportedNumericTerm(value)) {
    return null;
  }
  if (value === NULL_SYMBOL) {
    return buildNullCriteria(fieldName);
  }
  if (value.includes(RANGE_SEPARATOR)) {
    return buildRangeCriteria(fieldName, value, format);
  }
  return buildComparisonCriteria(fieldName, value, format);
}
