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
import LoadingProvider, { useLoading } from "../loading";
import type { ReactNode } from "react";

describe("LoadingContext", () => {
  const wrapper = ({ children }: { children: ReactNode }) => <LoadingProvider>{children}</LoadingProvider>;

  it("should provide initial loading state as false", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    expect(result.current.isLoading).toBe(false);
  });

  it("should provide showLoading function", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    expect(typeof result.current.showLoading).toBe("function");
  });

  it("should provide hideLoading function", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    expect(typeof result.current.hideLoading).toBe("function");
  });

  it("should set loading to true when showLoading is called", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.showLoading();
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should set loading to false when hideLoading is called", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    act(() => {
      result.current.showLoading();
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.hideLoading();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should handle multiple showLoading calls", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    act(() => {
      result.current.showLoading();
      result.current.showLoading();
      result.current.showLoading();
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle multiple hideLoading calls", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    act(() => {
      result.current.showLoading();
    });

    act(() => {
      result.current.hideLoading();
      result.current.hideLoading();
      result.current.hideLoading();
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should toggle loading state correctly", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    // Initially false
    expect(result.current.isLoading).toBe(false);

    // Show loading
    act(() => {
      result.current.showLoading();
    });
    expect(result.current.isLoading).toBe(true);

    // Hide loading
    act(() => {
      result.current.hideLoading();
    });
    expect(result.current.isLoading).toBe(false);

    // Show again
    act(() => {
      result.current.showLoading();
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useLoading());
    }).toThrow("useLoading must be used within a LoadingProvider");

    console.error = originalError;
  });

  it("should maintain stable function references", () => {
    const { result, rerender } = renderHook(() => useLoading(), { wrapper });

    const showLoadingRef = result.current.showLoading;
    const hideLoadingRef = result.current.hideLoading;

    rerender();

    expect(result.current.showLoading).toBe(showLoadingRef);
    expect(result.current.hideLoading).toBe(hideLoadingRef);
  });

  it("should work with multiple consumers sharing the same provider", () => {
    // Create a shared provider instance
    let sharedShowLoading: (() => void) | null = null;
    let sharedHideLoading: (() => void) | null = null;

    const { result: result1 } = renderHook(() => useLoading(), { wrapper });

    // Capture the shared functions
    sharedShowLoading = result1.current.showLoading;
    sharedHideLoading = result1.current.hideLoading;

    expect(result1.current.isLoading).toBe(false);

    act(() => {
      sharedShowLoading!();
    });

    expect(result1.current.isLoading).toBe(true);

    act(() => {
      sharedHideLoading!();
    });

    expect(result1.current.isLoading).toBe(false);
  });

  it("should handle rapid state changes", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    act(() => {
      result.current.showLoading();
      result.current.hideLoading();
      result.current.showLoading();
      result.current.hideLoading();
      result.current.showLoading();
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should have correct context type structure", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("showLoading");
    expect(result.current).toHaveProperty("hideLoading");
    expect(Object.keys(result.current).length).toBe(3);
  });

  it("should handle showLoading idempotently", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    act(() => {
      result.current.showLoading();
    });

    const stateAfterFirstCall = result.current.isLoading;

    act(() => {
      result.current.showLoading();
    });

    expect(result.current.isLoading).toBe(stateAfterFirstCall);
    expect(result.current.isLoading).toBe(true);
  });

  it("should handle hideLoading idempotently", () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    act(() => {
      result.current.hideLoading();
    });

    const stateAfterFirstCall = result.current.isLoading;

    act(() => {
      result.current.hideLoading();
    });

    expect(result.current.isLoading).toBe(stateAfterFirstCall);
    expect(result.current.isLoading).toBe(false);
  });
});
