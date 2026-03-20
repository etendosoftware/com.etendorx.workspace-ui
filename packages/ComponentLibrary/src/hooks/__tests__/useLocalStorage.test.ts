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
import { useLocalStorage } from "../useLocalStorage";

const localStorageMock = window.localStorage as jest.Mocked<typeof window.localStorage>;

describe("useLocalStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("returns the initial value when localStorage has no entry", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useLocalStorage("testKey", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("returns the initial value from a factory function", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useLocalStorage("testKey", () => 42));
    expect(result.current[0]).toBe(42);
  });

  it("reads an existing value from localStorage", () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("existingKey", "default"));
    expect(result.current[0]).toBe("stored");
  });

  it("calls setItem with the serialised new value", () => {
    const { result } = renderHook(() => useLocalStorage("writeKey", "initial"));
    act(() => {
      result.current[1]("updated");
    });
    expect(result.current[0]).toBe("updated");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("writeKey", JSON.stringify("updated"));
  });

  it("supports functional updates", () => {
    const { result } = renderHook(() => useLocalStorage("countKey", 0));
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]).toBe(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith("countKey", JSON.stringify(1));
  });

  it("calls removeItem when value is set to undefined", () => {
    const { result } = renderHook(() => useLocalStorage<string | undefined>("removeKey", "existing"));
    act(() => {
      result.current[1](undefined);
    });
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("removeKey");
  });

  it("supports object values", () => {
    const { result } = renderHook(() => useLocalStorage<Record<string, number>>("objKey", {}));
    act(() => {
      result.current[1]({ count: 5 });
    });
    expect(result.current[0]).toEqual({ count: 5 });
    expect(localStorageMock.setItem).toHaveBeenCalledWith("objKey", JSON.stringify({ count: 5 }));
  });
});
