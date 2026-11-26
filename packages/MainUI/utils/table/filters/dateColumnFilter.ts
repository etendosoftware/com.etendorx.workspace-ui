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

import { parseLocaleDate, toISODate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";

/**
 * Filter expressions the grid criteria builder already understands in a date column: comparisons
 * (">=01/10/2026"), negation ("!"), logical operators ("|", "&", " or ", " and ") and typed ranges
 * ("01/10/2026 - 31/10/2026"). They are sent as typed. Simple alternation, no nested quantifiers.
 */
const DATE_FILTER_EXPRESSION_PATTERN = /[<>=!|&]| -|\s(?:or|and)\s/i;

/**
 * Resolves the text typed in a date column filter into the value to apply:
 * - "" when the text is empty (clears the filter);
 * - "YYYY-MM-DD" when it is a date in the user's format, which filters that whole day;
 * - the text itself when it is a filter expression;
 * - null when it is neither, so it is reported as an invalid date and not applied.
 */
export const resolveTypedDateFilter = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const date = parseLocaleDate(trimmed);
  if (date) return toISODate(date);

  if (DATE_FILTER_EXPRESSION_PATTERN.test(trimmed)) return text;
  return null;
};
