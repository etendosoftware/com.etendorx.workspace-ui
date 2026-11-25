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

import { formatBrowserDate, parseLocaleDate, toISODate } from "../../utils/dateFormatter";

/** How the dates of a date filter are chosen: one day, or a range that may be open at either end. */
export const DATE_FILTER_MODE = {
  SINGLE: "single",
  RANGE: "range",
} as const;

export type DateFilterMode = (typeof DATE_FILTER_MODE)[keyof typeof DATE_FILTER_MODE];

/** The dates chosen in a date filter. In single mode only `start` is used. */
export interface DateFilterSelection {
  mode: DateFilterMode;
  start: Date | null;
  end: Date | null;
}

export type DateTranslateFn = (key: string) => string;

/**
 * Separator between both ends of a range filter value ("2026-10-01 - 2026-10-31", "2026-10-01 - ",
 * " - 2026-10-31"). The grid criteria builder (`LegacyColumnFilterUtils`) splits on it.
 */
export const DATE_RANGE_SEPARATOR = " - ";

const RANGE_SEPARATOR_MARK = DATE_RANGE_SEPARATOR.trimEnd();
const ISO_FILTER_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const createEmptySelection = (mode: DateFilterMode): DateFilterSelection => ({ mode, start: null, end: null });

const toISOOrEmpty = (date: Date | null): string => (date ? toISODate(date) : "");

/**
 * Builds the filter value sent for a date column: "YYYY-MM-DD" for one day (the backend filters the whole
 * day, also in date-time columns), or a range with an optional end on each side. Empty when nothing is chosen.
 */
export const buildDateFilterValue = ({ mode, start, end }: DateFilterSelection): string => {
  if (mode === DATE_FILTER_MODE.SINGLE) return toISOOrEmpty(start);
  if (!start && !end) return "";
  return `${toISOOrEmpty(start)}${DATE_RANGE_SEPARATOR}${toISOOrEmpty(end)}`;
};

/** Parses one end of a stored filter value: "" is an open end, anything else must be an ISO date. */
const parseFilterEnd = (text: string): Date | null | undefined => {
  if (!text) return null;
  if (!ISO_FILTER_DATE_PATTERN.test(text)) return undefined;
  return parseLocaleDate(text) ?? undefined;
};

const parseRangeFilterValue = (value: string): DateFilterSelection | null => {
  const separatorIndex = value.indexOf(RANGE_SEPARATOR_MARK);
  if (separatorIndex === -1) return null;

  const start = parseFilterEnd(value.substring(0, separatorIndex).trim());
  const end = parseFilterEnd(value.substring(separatorIndex + RANGE_SEPARATOR_MARK.length).trim());
  if (start === undefined || end === undefined || (!start && !end)) return null;

  return { mode: DATE_FILTER_MODE.RANGE, start, end };
};

/**
 * Reads a stored filter value back into a selection. Returns null when the value is not one built by
 * `buildDateFilterValue` (e.g. an expression typed in the column filter such as ">=01/10/2026").
 */
export const parseDateFilterValue = (value: string | undefined): DateFilterSelection | null => {
  if (!value) return null;

  // The untrimmed value is kept for ranges: " - 2026-10-31" needs its leading space to find the separator
  const trimmed = value.trim();
  if (ISO_FILTER_DATE_PATTERN.test(trimmed)) {
    const date = parseLocaleDate(trimmed);
    return date ? { mode: DATE_FILTER_MODE.SINGLE, start: date, end: null } : null;
  }

  return parseRangeFilterValue(value);
};

/**
 * Text that says what a selection filters: the day ("13/10/2026"), the range ("01/10/2026 - 31/10/2026"),
 * or an open range ("From 01/10/2026", "To 31/10/2026"). Empty when nothing is chosen.
 */
export const formatDateFilterLabel = ({ mode, start, end }: DateFilterSelection, t: DateTranslateFn): string => {
  if (mode === DATE_FILTER_MODE.SINGLE) return formatBrowserDate(start);
  if (start && end) return `${formatBrowserDate(start)}${DATE_RANGE_SEPARATOR}${formatBrowserDate(end)}`;
  if (start) return `${t("dateModal.from")} ${formatBrowserDate(start)}`;
  if (end) return `${t("dateModal.to")} ${formatBrowserDate(end)}`;
  return "";
};

/** Swaps both ends of a range when the end is before the start. */
export const orderRange = (selection: DateFilterSelection): DateFilterSelection => {
  const { start, end } = selection;
  if (start && end && end < start) return { ...selection, start: end, end: start };
  return selection;
};

/**
 * Applies a day picked in the calendar. Single mode takes the day; range mode sets the start, then the end,
 * and starts a new range on the next pick, as the calendar always did.
 */
export const applyDayToSelection = (selection: DateFilterSelection, day: Date): DateFilterSelection => {
  const { mode, start, end } = selection;
  if (mode === DATE_FILTER_MODE.SINGLE || !start || end) return { mode, start: day, end: null };
  return orderRange({ mode, start, end: day });
};

/** Changes the mode keeping the start; the end only exists in range mode. */
export const changeSelectionMode = (selection: DateFilterSelection, mode: DateFilterMode): DateFilterSelection => ({
  mode,
  start: selection.start,
  end: mode === DATE_FILTER_MODE.RANGE ? selection.end : null,
});
