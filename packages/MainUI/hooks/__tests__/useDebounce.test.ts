/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should debounce the function call", async () => {
    const fn = jest.fn((val: string) => Promise.resolve(val));
    const delay = 500;
    const { result } = renderHook(() => useDebounce(fn, delay));

    let promise: Promise<string> | undefined;
    act(() => {
      promise = result.current("test1");
    });

    expect(fn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(delay);
    });

    await act(async () => {
      const value = await promise;
      expect(value).toBe("test1");
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("test1");
  });

  it("should only call the latest function call if multiple calls are made during delay", async () => {
    const fn = jest.fn((val: string) => Promise.resolve(val));
    const delay = 500;
    const { result } = renderHook(() => useDebounce(fn, delay));

    let promise1: Promise<string> | undefined;
    let promise2: Promise<string> | undefined;

    act(() => {
      promise1 = result.current("test1");
    });

    act(() => {
      jest.advanceTimersByTime(250);
      promise2 = result.current("test2");
    });

    expect(fn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(delay);
    });

    await act(async () => {
      const value2 = await promise2;
      expect(value2).toBe("test2");
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("test2");
  });

  it("should return undefined if the function is not provided", () => {
    const { result } = renderHook(() => useDebounce(undefined));
    
    let returnValue: any;
    act(() => {
      returnValue = result.current("test");
    });

    expect(returnValue).toBeUndefined();
  });

  it("should handle function errors", async () => {
    const error = new Error("Test Error");
    const fn = jest.fn(() => Promise.reject(error));
    const delay = 500;
    const { result } = renderHook(() => useDebounce(fn, delay));

    let promise: Promise<any> | undefined;
    act(() => {
      promise = result.current();
    });

    act(() => {
      jest.advanceTimersByTime(delay);
    });

    try {
      await act(async () => {
        await promise;
      });
      fail("Should have thrown an error");
    } catch (e) {
      expect(e).toBe(error);
    }
  });

  it("should clear the timeout on unmount", () => {
    const fn = jest.fn(() => Promise.resolve());
    const delay = 500;
    const { result, unmount } = renderHook(() => useDebounce(fn, delay));

    act(() => {
      result.current();
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(delay);
    });

    expect(fn).not.toHaveBeenCalled();
  });
});
