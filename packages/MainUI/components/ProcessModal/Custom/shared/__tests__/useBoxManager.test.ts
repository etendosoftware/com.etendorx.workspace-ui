/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import { act, renderHook } from "@testing-library/react";
import { useBoxManager } from "../useBoxManager";

jest.useFakeTimers();

describe("useBoxManager", () => {
  it("initializes with default boxCount=1 and currentBox=1", () => {
    const { result } = renderHook(() => useBoxManager());
    expect(result.current.boxCount).toBe(1);
    expect(result.current.currentBox).toBe(1);
  });

  it("accepts a custom initial box count", () => {
    const { result } = renderHook(() => useBoxManager(3));
    expect(result.current.boxCount).toBe(3);
  });

  describe("handleAddBox", () => {
    it("increments boxCount and sets currentBox to the new box", () => {
      const { result } = renderHook(() => useBoxManager(1));
      const setLines = jest.fn();

      act(() => {
        result.current.handleAddBox(setLines);
      });

      expect(result.current.boxCount).toBe(2);
      expect(result.current.currentBox).toBe(2);
    });

    it("adds a new box key with value 0 to each line", () => {
      const { result } = renderHook(() => useBoxManager(1));

      const initialLines = [
        { id: "L1", box1: 5 },
        { id: "L2", box1: 3 },
      ];

      let capturedUpdater: ((prev: typeof initialLines) => typeof initialLines) | undefined;
      const setLines = jest.fn((updater) => {
        capturedUpdater = updater;
      });

      act(() => {
        result.current.handleAddBox(setLines);
      });

      expect(setLines).toHaveBeenCalledTimes(1);
      const newLines = capturedUpdater!(initialLines);
      expect(newLines[0]).toMatchObject({ id: "L1", box1: 5, box2: 0 });
      expect(newLines[1]).toMatchObject({ id: "L2", box1: 3, box2: 0 });
    });

    it("focuses the barcode input after a timeout", () => {
      const { result } = renderHook(() => useBoxManager());
      const mockFocus = jest.fn();
      const setLines = jest.fn();

      // Simulate a ref being attached
      Object.defineProperty(result.current.barcodeInputRef, "current", {
        get: () => ({ focus: mockFocus }),
        configurable: true,
      });

      act(() => {
        result.current.handleAddBox(setLines);
        jest.runAllTimers();
      });

      expect(mockFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleRemoveBox", () => {
    it("decrements boxCount when more than one box exists", () => {
      const { result } = renderHook(() => useBoxManager(2));
      const setLines = jest.fn();

      act(() => {
        result.current.handleRemoveBox(setLines);
      });

      expect(result.current.boxCount).toBe(1);
    });

    it("does nothing when boxCount is already 1", () => {
      const { result } = renderHook(() => useBoxManager(1));
      const setLines = jest.fn();

      act(() => {
        result.current.handleRemoveBox(setLines);
      });

      expect(result.current.boxCount).toBe(1);
      expect(setLines).not.toHaveBeenCalled();
    });

    it("removes the last box key from each line", () => {
      const { result } = renderHook(() => useBoxManager(2));

      const initialLines = [
        { id: "L1", box1: 5, box2: 3 },
        { id: "L2", box1: 2, box2: 7 },
      ];

      let capturedUpdater: ((prev: typeof initialLines) => typeof initialLines) | undefined;
      const setLines = jest.fn((updater) => {
        capturedUpdater = updater;
      });

      act(() => {
        result.current.handleRemoveBox(setLines);
      });

      const newLines = capturedUpdater!(initialLines);
      expect(newLines[0]).not.toHaveProperty("box2");
      expect(newLines[0]).toMatchObject({ id: "L1", box1: 5 });
    });

    it("adjusts currentBox down when it equals the removed box number", () => {
      const { result } = renderHook(() => useBoxManager(2));
      const setLines = jest.fn();

      // Navigate to box 2, then remove
      act(() => {
        result.current.setCurrentBox(2);
      });

      act(() => {
        result.current.handleRemoveBox(setLines);
      });

      expect(result.current.currentBox).toBe(1);
    });
  });
});
