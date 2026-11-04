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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

/** How long a field changed by a callout stays highlighted (matches the CSS fade animation). */
export const CALLOUT_HIGHLIGHT_DURATION_MS = 1500;

const FORM_SCOPE_PREFIX = "form";
const GRID_SCOPE_PREFIX = "grid";
const SCOPE_SEPARATOR = ":";

const CLASSIC_TRUE_VALUES = new Set(["Y", "true"]);
const CLASSIC_FALSE_VALUES = new Set(["", "false"]);

/** Highlight scope of a tab's form: one form per tab is shown at a time. */
export const getFormHighlightScope = (tabId: string): string => [FORM_SCOPE_PREFIX, tabId].join(SCOPE_SEPARATOR);

/** Highlight scope of a row edited inline in a tab's grid. */
export const getGridHighlightScope = (tabId: string, rowId: string): string =>
  [GRID_SCOPE_PREFIX, tabId, rowId].join(SCOPE_SEPARATOR);

/**
 * Converts a value returned by the FIC into the value a field holds. Etendo encodes the
 * boolean reference (YES_NO) as "" for false and "Y" for true; anything else is kept as is.
 */
export const toCalloutFieldValue = <T>(field: Field | undefined, value: T): T | boolean => {
  if (field?.column?.reference !== FIELD_REFERENCE_CODES.BOOLEAN.id || typeof value !== "string") {
    return value;
  }
  if (CLASSIC_TRUE_VALUES.has(value)) {
    return true;
  }
  if (CLASSIC_FALSE_VALUES.has(value)) {
    return false;
  }
  return value;
};

const toComparableText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const toComparableNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" && typeof value !== "string") {
    return undefined;
  }
  if (toComparableText(value).trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return undefined;
};

/**
 * Whether a value a callout returned is the value the field already had. Like Classic's
 * `field.compareValues` (which flags `_changedByFic`), empty values are equal to each other
 * and numbers are compared by value, so "10.00" and 10 are not reported as a change.
 */
export const areCalloutValuesEqual = (previous: unknown, next: unknown): boolean => {
  const previousNumber = toComparableNumber(previous);
  const nextNumber = toComparableNumber(next);
  if (previousNumber !== undefined && nextNumber !== undefined) {
    return previousNumber === nextNumber;
  }
  return toComparableText(previous) === toComparableText(next);
};

/** Names of the fields in `nextValues` whose value differs from the one in `previousValues`. */
export const collectChangedFieldNames = (
  previousValues: Record<string, unknown>,
  nextValues: Record<string, unknown>
): string[] =>
  Object.entries(nextValues)
    .filter(([fieldName, nextValue]) => !areCalloutValuesEqual(previousValues[fieldName], nextValue))
    .map(([fieldName]) => fieldName);
