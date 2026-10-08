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
import { useSettledValue } from "../useSettledValue";

const DELAY = 400;

const setup = (initial: string) =>
  renderHook(({ value }) => useSettledValue(value, DELAY), { initialProps: { value: initial } });

describe("useSettledValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the initial value", () => {
    const { result } = setup("a");
    expect(result.current).toBe("a");
  });

  it("passes a change after a quiet period through in the same render", () => {
    const { result, rerender } = setup("a");
    act(() => jest.advanceTimersByTime(DELAY));
    rerender({ value: "b" });
    expect(result.current).toBe("b");
  });

  it("holds changes that follow quickly and returns only the last one once stable", () => {
    const { result, rerender } = setup("a");
    act(() => jest.advanceTimersByTime(DELAY));
    rerender({ value: "b" });
    act(() => jest.advanceTimersByTime(100));
    rerender({ value: "c" });
    act(() => jest.advanceTimersByTime(100));
    rerender({ value: "d" });
    expect(result.current).toBe("b");

    act(() => jest.advanceTimersByTime(DELAY - 1));
    expect(result.current).toBe("b");
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe("d");
  });

  it("restarts the quiet period on every change", () => {
    const { result, rerender } = setup("a");
    act(() => jest.advanceTimersByTime(DELAY));
    rerender({ value: "b" });
    for (const value of ["c", "d", "e"]) {
      act(() => jest.advanceTimersByTime(300));
      rerender({ value });
    }
    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe("b");
    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe("e");
  });

  it("keeps the settled value when a burst ends where it started", () => {
    const { result, rerender } = setup("a");
    act(() => jest.advanceTimersByTime(DELAY));
    rerender({ value: "b" });
    act(() => jest.advanceTimersByTime(100));
    rerender({ value: "c" });
    act(() => jest.advanceTimersByTime(100));
    rerender({ value: "b" });
    act(() => jest.advanceTimersByTime(DELAY));
    expect(result.current).toBe("b");
  });

  it("does not update after unmounting during a hold", () => {
    const { result, rerender, unmount } = setup("a");
    act(() => jest.advanceTimersByTime(DELAY));
    rerender({ value: "b" });
    act(() => jest.advanceTimersByTime(100));
    rerender({ value: "c" });
    unmount();
    expect(() => act(() => jest.advanceTimersByTime(DELAY))).not.toThrow();
    expect(result.current).toBe("b");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("passes the first change straight through after mounting", () => {
    const { result, rerender } = setup("a");
    rerender({ value: "b" });
    expect(result.current).toBe("b");
  });
});
