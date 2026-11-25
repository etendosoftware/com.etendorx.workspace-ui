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

import { act, renderHook } from "@testing-library/react";
import { DATE_FILTER_MODE } from "../dateFilterSelection";
import { useDateFilterSelection } from "../useDateFilterSelection";

const { SINGLE, RANGE } = DATE_FILTER_MODE;
const OCT_1 = new Date(2026, 9, 1);
const OCT_31 = new Date(2026, 9, 31);
// ISO text is read the same way in every browser locale
const TYPED_MARCH_5 = "2027-03-05";
const MARCH_5 = new Date(2027, 2, 5);
const INVALID_TEXT = "not a date";

type HookParams = Parameters<typeof useDateFilterSelection>[0];

const renderSelection = (params: Partial<HookParams> = {}) =>
  renderHook((props: HookParams) => useDateFilterSelection(props), {
    initialProps: { isOpen: true, ...params },
  });

describe("useDateFilterSelection", () => {
  it("opens in one-date mode with no dates by default", () => {
    const { result } = renderSelection();
    expect(result.current.selection).toEqual({ mode: SINGLE, start: null, end: null });
    expect(result.current.hasInvalidDate).toBe(false);
  });

  it("opens with the applied range and shows its first month", () => {
    const { result } = renderSelection({ initialMode: RANGE, initialStartDate: OCT_1, initialEndDate: OCT_31 });
    expect(result.current.selection).toEqual({ mode: RANGE, start: OCT_1, end: OCT_31 });
    expect(result.current.visibleMonth).toEqual(OCT_1);
  });

  it("picks one day in single mode and moves the calendar to it", () => {
    const { result } = renderSelection();
    act(() => result.current.selectDay(MARCH_5));
    expect(result.current.selection).toEqual({ mode: SINGLE, start: MARCH_5, end: null });
    expect(result.current.visibleMonth).toEqual(new Date(2027, 2, 1));
  });

  it("changes the mode keeping the start", () => {
    const { result } = renderSelection({ initialMode: RANGE, initialStartDate: OCT_1, initialEndDate: OCT_31 });
    act(() => result.current.setMode(SINGLE));
    expect(result.current.selection).toEqual({ mode: SINGLE, start: OCT_1, end: null });
  });

  it("applies a typed date and moves the calendar to it", () => {
    const { result } = renderSelection();
    act(() => result.current.commitTypedDate("start", TYPED_MARCH_5));
    expect(result.current.selection.start).toEqual(MARCH_5);
    expect(result.current.visibleMonth).toEqual(new Date(2027, 2, 1));
  });

  it("orders a typed range as the calendar does", () => {
    const { result } = renderSelection({ initialMode: RANGE, initialStartDate: MARCH_5 });
    act(() => result.current.commitTypedDate("end", "2026-10-01"));
    expect(result.current.selection).toEqual({ mode: RANGE, start: OCT_1, end: MARCH_5 });
  });

  it("flags invalid typed text without changing the dates", () => {
    const { result } = renderSelection({ initialStartDate: OCT_1 });
    act(() => result.current.commitTypedDate("start", INVALID_TEXT));
    expect(result.current.invalidEdges).toEqual({ start: true, end: false });
    expect(result.current.hasInvalidDate).toBe(true);
    expect(result.current.selection.start).toEqual(OCT_1);
  });

  it("clears one end when its text is emptied", () => {
    const { result } = renderSelection({ initialMode: RANGE, initialStartDate: OCT_1, initialEndDate: OCT_31 });
    act(() => result.current.commitTypedDate("end", "  "));
    expect(result.current.selection).toEqual({ mode: RANGE, start: OCT_1, end: null });
  });

  it.each([
    ["picking a day", (hook: ReturnType<typeof useDateFilterSelection>) => hook.selectDay(OCT_1)],
    ["changing the mode", (hook: ReturnType<typeof useDateFilterSelection>) => hook.setMode(RANGE)],
    ["clearing", (hook: ReturnType<typeof useDateFilterSelection>) => hook.clearSelection()],
  ])("removes the invalid flag when %s", (_, action) => {
    const { result } = renderSelection();
    act(() => result.current.commitTypedDate("start", INVALID_TEXT));
    act(() => action(result.current));
    expect(result.current.hasInvalidDate).toBe(false);
  });

  it("clears the dates keeping the mode", () => {
    const { result } = renderSelection({ initialMode: RANGE, initialStartDate: OCT_1, initialEndDate: OCT_31 });
    act(() => result.current.clearSelection());
    expect(result.current.selection).toEqual({ mode: RANGE, start: null, end: null });
  });

  it("starts again from the applied filter when the window reopens", () => {
    const { result, rerender } = renderSelection({ initialStartDate: OCT_1 });
    act(() => result.current.selectDay(MARCH_5));
    rerender({ isOpen: false, initialStartDate: OCT_1 });
    rerender({ isOpen: true, initialStartDate: OCT_1 });
    expect(result.current.selection.start).toEqual(OCT_1);
  });
});
