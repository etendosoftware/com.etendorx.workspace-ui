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

import { formatBrowserDate } from "../../../utils/dateFormatter";
import {
  applyDayToSelection,
  buildDateFilterValue,
  changeSelectionMode,
  createEmptySelection,
  DATE_FILTER_MODE,
  type DateFilterSelection,
  formatDateFilterLabel,
  orderRange,
  parseDateFilterValue,
} from "../dateFilterSelection";

const { SINGLE, RANGE } = DATE_FILTER_MODE;
const OCT_1 = new Date(2026, 9, 1);
const OCT_13 = new Date(2026, 9, 13);
const OCT_31 = new Date(2026, 9, 31);
const ISO_OCT_1 = "2026-10-01";
const ISO_OCT_31 = "2026-10-31";
const t = (key: string) => `[${key}]`;

const single = (start: Date | null): DateFilterSelection => ({ mode: SINGLE, start, end: null });
const range = (start: Date | null, end: Date | null): DateFilterSelection => ({ mode: RANGE, start, end });

describe("dateFilterSelection", () => {
  describe("buildDateFilterValue", () => {
    it.each<[string, DateFilterSelection, string]>([
      ["one date", single(OCT_13), "2026-10-13"],
      ["a range", range(OCT_1, OCT_31), `${ISO_OCT_1} - ${ISO_OCT_31}`],
      ["a range open at the end", range(OCT_1, null), `${ISO_OCT_1} - `],
      ["a range open at the start", range(null, OCT_31), ` - ${ISO_OCT_31}`],
      ["an empty range", range(null, null), ""],
      ["an empty single date", single(null), ""],
    ])("builds %s", (_, selection, expected) => {
      expect(buildDateFilterValue(selection)).toBe(expected);
    });
  });

  describe("parseDateFilterValue", () => {
    it.each<[string, DateFilterSelection]>([
      ["2026-10-13", single(OCT_13)],
      [`${ISO_OCT_1} - ${ISO_OCT_31}`, range(OCT_1, OCT_31)],
      [`${ISO_OCT_1} - `, range(OCT_1, null)],
      [` - ${ISO_OCT_31}`, range(null, OCT_31)],
    ])("reads %p", (value, expected) => {
      expect(parseDateFilterValue(value)).toEqual(expected);
    });

    it.each([
      undefined,
      "",
      "   ",
      ">=01/10/2026",
      "13/10/2026",
      "2026-02-31",
      " - ",
      `${ISO_OCT_1} - abc`,
      "2026-02-31 - ",
    ])("returns null for %p", (value) => {
      expect(parseDateFilterValue(value)).toBeNull();
    });

    it("reads back every value it builds", () => {
      for (const selection of [single(OCT_13), range(OCT_1, OCT_31), range(OCT_1, null), range(null, OCT_31)]) {
        expect(parseDateFilterValue(buildDateFilterValue(selection))).toEqual(selection);
      }
    });
  });

  describe("formatDateFilterLabel", () => {
    it.each<[string, DateFilterSelection, string]>([
      ["one date", single(OCT_13), formatBrowserDate(OCT_13)],
      ["a range", range(OCT_1, OCT_31), `${formatBrowserDate(OCT_1)} - ${formatBrowserDate(OCT_31)}`],
      ["a range open at the end", range(OCT_1, null), `[dateModal.from] ${formatBrowserDate(OCT_1)}`],
      ["a range open at the start", range(null, OCT_31), `[dateModal.to] ${formatBrowserDate(OCT_31)}`],
      ["an empty range", range(null, null), ""],
    ])("describes %s", (_, selection, expected) => {
      expect(formatDateFilterLabel(selection, t)).toBe(expected);
    });
  });

  describe("orderRange", () => {
    it("swaps the ends of an inverted range", () => {
      expect(orderRange(range(OCT_31, OCT_1))).toEqual(range(OCT_1, OCT_31));
    });

    it("keeps an ordered or open range", () => {
      const ordered = range(OCT_1, OCT_31);
      expect(orderRange(ordered)).toBe(ordered);
      expect(orderRange(range(OCT_1, null))).toEqual(range(OCT_1, null));
    });
  });

  describe("applyDayToSelection", () => {
    it("replaces the day in single mode", () => {
      expect(applyDayToSelection(single(OCT_1), OCT_13)).toEqual(single(OCT_13));
    });

    it("sets the start, then the end, then starts a new range", () => {
      const started = applyDayToSelection(createEmptySelection(RANGE), OCT_1);
      expect(started).toEqual(range(OCT_1, null));
      const completed = applyDayToSelection(started, OCT_31);
      expect(completed).toEqual(range(OCT_1, OCT_31));
      expect(applyDayToSelection(completed, OCT_13)).toEqual(range(OCT_13, null));
    });

    it("swaps the ends when the second day is before the first", () => {
      expect(applyDayToSelection(range(OCT_31, null), OCT_1)).toEqual(range(OCT_1, OCT_31));
    });
  });

  describe("changeSelectionMode", () => {
    it("keeps the start and drops the end when switching to one date", () => {
      expect(changeSelectionMode(range(OCT_1, OCT_31), SINGLE)).toEqual(single(OCT_1));
    });

    it("keeps the start when switching to a range", () => {
      expect(changeSelectionMode(single(OCT_13), RANGE)).toEqual(range(OCT_13, null));
    });
  });
});
