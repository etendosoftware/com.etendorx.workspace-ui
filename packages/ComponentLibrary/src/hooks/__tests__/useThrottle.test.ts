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

import { renderHook, act } from "@testing-library/react";
import { useThrottle } from "../useThrottle";

describe("useThrottle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls the function immediately on first invocation", () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));
    act(() => {
      result.current("arg1");
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg1");
  });

  it("does not call the function again within the delay window", () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));
    act(() => {
      result.current();
      result.current();
      result.current();
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("calls the function again after the delay has passed", () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));
    act(() => {
      result.current();
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(600);
      result.current();
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("passes all arguments to the underlying function", () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useThrottle(fn, 200));
    act(() => {
      result.current("a", "b", 3);
    });
    expect(fn).toHaveBeenCalledWith("a", "b", 3);
  });
});
