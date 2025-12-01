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

import { renderHook } from "@testing-library/react";
import { usePrevious } from "../usePrevious";

describe("usePrevious", () => {
  it("should return the initial value on first render", () => {
    const { result } = renderHook(() => usePrevious("initial"));

    expect(result.current).toBe("initial");
  });

  it("should return the previous value after update", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: "first" },
    });

    expect(result.current).toBe("first");

    rerender({ value: "second" });
    expect(result.current).toBe("first");

    rerender({ value: "third" });
    expect(result.current).toBe("second");
  });

  it("should work with numbers", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });

    expect(result.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 3 });
    expect(result.current).toBe(2);
  });

  it("should work with objects", () => {
    const obj1 = { id: 1, name: "first" };
    const obj2 = { id: 2, name: "second" };
    const obj3 = { id: 3, name: "third" };

    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: obj1 },
    });

    expect(result.current).toBe(obj1);

    rerender({ value: obj2 });
    expect(result.current).toBe(obj1);

    rerender({ value: obj3 });
    expect(result.current).toBe(obj2);
  });

  it("should use custom initial value when provided", () => {
    const { result } = renderHook(() => usePrevious("current", "custom-initial"));

    expect(result.current).toBe("custom-initial");
  });

  it("should update to current value after first render with custom initial", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value, "initial"), {
      initialProps: { value: "first" },
    });

    expect(result.current).toBe("initial");

    rerender({ value: "second" });
    expect(result.current).toBe("first");
  });

  it("should work with boolean values", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: true },
    });

    expect(result.current).toBe(true);

    rerender({ value: false });
    expect(result.current).toBe(true);

    rerender({ value: true });
    expect(result.current).toBe(false);
  });

  it("should work with null and undefined", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: null as null | undefined | string },
    });

    expect(result.current).toBe(null);

    rerender({ value: undefined });
    expect(result.current).toBe(null);

    rerender({ value: "value" });
    expect(result.current).toBe(undefined);
  });

  it("should work with arrays", () => {
    const arr1 = [1, 2, 3];
    const arr2 = [4, 5, 6];

    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: arr1 },
    });

    expect(result.current).toBe(arr1);

    rerender({ value: arr2 });
    expect(result.current).toBe(arr1);
  });
});
