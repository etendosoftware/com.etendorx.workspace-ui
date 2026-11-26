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

import { useCallback, useEffect, useState } from "react";
import { parseLocaleDate } from "../../utils/dateFormatter";
import {
  applyDayToSelection,
  changeSelectionMode,
  createEmptySelection,
  DATE_FILTER_MODE,
  type DateFilterMode,
  type DateFilterSelection,
  orderRange,
} from "./dateFilterSelection";

/** End of the selection a typed date belongs to. Single mode uses `start`. */
export type DateSelectionEdge = "start" | "end";

type InvalidEdges = Record<DateSelectionEdge, boolean>;

const NO_INVALID_EDGES: InvalidEdges = { start: false, end: false };

interface UseDateFilterSelectionParams {
  isOpen: boolean;
  initialMode?: DateFilterMode;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

const firstDayOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

const buildInitialSelection = ({
  initialMode = DATE_FILTER_MODE.SINGLE,
  initialStartDate,
  initialEndDate,
}: UseDateFilterSelectionParams): DateFilterSelection =>
  changeSelectionMode(
    { mode: DATE_FILTER_MODE.RANGE, start: initialStartDate ?? null, end: initialEndDate ?? null },
    initialMode
  );

/**
 * State of a date filter window: the chosen dates, the month shown in the calendar and the typed dates that
 * could not be read. The dates can be picked in the calendar or typed; a typed date moves the calendar to it.
 */
export const useDateFilterSelection = (params: UseDateFilterSelectionParams) => {
  const { isOpen, initialMode, initialStartDate, initialEndDate } = params;
  const [selection, setSelection] = useState<DateFilterSelection>(() => buildInitialSelection(params));
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => firstDayOfMonth(initialStartDate ?? new Date()));
  const [invalidEdges, setInvalidEdges] = useState<InvalidEdges>(NO_INVALID_EDGES);

  // Every time the window opens it starts again from the applied filter
  useEffect(() => {
    if (!isOpen) return;
    setSelection(buildInitialSelection({ isOpen, initialMode, initialStartDate, initialEndDate }));
    setVisibleMonth(firstDayOfMonth(initialStartDate ?? new Date()));
    setInvalidEdges(NO_INVALID_EDGES);
  }, [isOpen, initialMode, initialStartDate, initialEndDate]);

  const showMonthOf = useCallback((date: Date) => setVisibleMonth(firstDayOfMonth(date)), []);

  const selectDay = useCallback(
    (day: Date) => {
      setSelection((previous) => applyDayToSelection(previous, day));
      setInvalidEdges(NO_INVALID_EDGES);
      showMonthOf(day);
    },
    [showMonthOf]
  );

  const setMode = useCallback((mode: DateFilterMode) => {
    setSelection((previous) => changeSelectionMode(previous, mode));
    setInvalidEdges(NO_INVALID_EDGES);
  }, []);

  /** Applies the text typed in one end: a valid date is set, empty text clears it, anything else is flagged. */
  const commitTypedDate = useCallback(
    (edge: DateSelectionEdge, text: string) => {
      const isEmpty = !text.trim();
      const date = parseLocaleDate(text);
      const isInvalid = !isEmpty && !date;
      setInvalidEdges((previous) => ({ ...previous, [edge]: isInvalid }));
      if (isInvalid) return;

      setSelection((previous) => orderRange({ ...previous, [edge]: date }));
      if (date) showMonthOf(date);
    },
    [showMonthOf]
  );

  const clearSelection = useCallback(() => {
    setSelection((previous) => createEmptySelection(previous.mode));
    setInvalidEdges(NO_INVALID_EDGES);
  }, []);

  return {
    selection,
    visibleMonth,
    setVisibleMonth,
    invalidEdges,
    hasInvalidDate: invalidEdges.start || invalidEdges.end,
    selectDay,
    setMode,
    commitTypedDate,
    clearSelection,
  };
};
