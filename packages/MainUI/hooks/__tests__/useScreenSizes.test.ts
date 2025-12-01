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
import { useScreenSizes } from "../useScreenSizes";

describe("useScreenSizes", () => {
  // Store original values
  const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");

  beforeEach(() => {
    // Reset to defaults before each test
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 1024;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 768;
      },
    });
  });

  afterEach(() => {
    // Restore original descriptors
    if (originalClientWidth) {
      Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth);
    }
    if (originalClientHeight) {
      Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
    }
  });

  it("should return actual window dimensions when window is defined", () => {
    const mockClientWidth = 1920;
    const mockClientHeight = 1080;

    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return mockClientWidth;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return mockClientHeight;
      },
    });

    const { result } = renderHook(() => useScreenSizes());

    expect(result.current.clientWidth).toBe(mockClientWidth);
    expect(result.current.clientHeight).toBe(mockClientHeight);
  });

  it("should return updated dimensions when body size changes", () => {
    const initialWidth = 800;
    const initialHeight = 600;

    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return initialWidth;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return initialHeight;
      },
    });

    const { result, rerender } = renderHook(() => useScreenSizes());

    expect(result.current).toEqual({
      clientWidth: initialWidth,
      clientHeight: initialHeight,
    });

    // Change dimensions
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 1024;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 768;
      },
    });

    rerender();

    expect(result.current).toEqual({
      clientWidth: 1024,
      clientHeight: 768,
    });
  });

  it("should handle mobile screen sizes", () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 375;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 667;
      },
    });

    const { result } = renderHook(() => useScreenSizes());

    expect(result.current).toEqual({
      clientWidth: 375,
      clientHeight: 667,
    });
  });

  it("should handle tablet screen sizes", () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 768;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 1024;
      },
    });

    const { result } = renderHook(() => useScreenSizes());

    expect(result.current).toEqual({
      clientWidth: 768,
      clientHeight: 1024,
    });
  });

  it("should handle very large screen sizes", () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 3840;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 2160;
      },
    });

    const { result } = renderHook(() => useScreenSizes());

    expect(result.current).toEqual({
      clientWidth: 3840,
      clientHeight: 2160,
    });
  });

  it("should handle zero dimensions gracefully", () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 0;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 0;
      },
    });

    const { result } = renderHook(() => useScreenSizes());

    expect(result.current).toEqual({
      clientWidth: 0,
      clientHeight: 0,
    });
  });

  it("should return dimensions based on document.body element", () => {
    const mockWidth = 1440;
    const mockHeight = 900;

    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return mockWidth;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return mockHeight;
      },
    });

    const { result } = renderHook(() => useScreenSizes());

    expect(result.current.clientWidth).toBe(mockWidth);
    expect(result.current.clientHeight).toBe(mockHeight);
  });

  it("should work consistently across multiple calls", () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get() {
        return 1280;
      },
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return 720;
      },
    });

    const { result: result1 } = renderHook(() => useScreenSizes());
    const { result: result2 } = renderHook(() => useScreenSizes());

    expect(result1.current).toEqual(result2.current);
    expect(result1.current).toEqual({
      clientWidth: 1280,
      clientHeight: 720,
    });
  });
});
