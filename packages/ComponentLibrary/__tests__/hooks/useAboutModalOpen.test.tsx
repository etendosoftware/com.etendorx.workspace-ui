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
import { useAboutModalOpen } from "../../src/components/About/hooks/useAboutModalOpen";

describe("useAboutModalOpen", () => {
  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe("initialization", () => {
    it("should return isOpen, openModal, and closeModal", () => {
      const { result } = renderHook(() => useAboutModalOpen());

      expect(result.current).toHaveProperty("isOpen");
      expect(result.current).toHaveProperty("openModal");
      expect(result.current).toHaveProperty("closeModal");
    });

    it("should initialize with isOpen as false", () => {
      const { result } = renderHook(() => useAboutModalOpen());

      expect(result.current.isOpen).toBe(false);
    });

    it("should return stable function references", () => {
      const { result, rerender } = renderHook(() => useAboutModalOpen());

      const { openModal: firstOpen, closeModal: firstClose } = result.current;

      rerender();

      expect(result.current.openModal).toBe(firstOpen);
      expect(result.current.closeModal).toBe(firstClose);
    });
  });

  // ============================================================================
  // openModal Tests
  // ============================================================================

  describe("openModal", () => {
    it("should set isOpen to true when called", () => {
      const { result } = renderHook(() => useAboutModalOpen());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it("should remain true if called multiple times", () => {
      const { result } = renderHook(() => useAboutModalOpen());

      act(() => {
        result.current.openModal();
        result.current.openModal();
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  // ============================================================================
  // closeModal Tests
  // ============================================================================

  describe("closeModal", () => {
    it("should set isOpen to false when called", () => {
      const { result } = renderHook(() => useAboutModalOpen());

      // First open the modal
      act(() => {
        result.current.openModal();
      });

      expect(result.current.isOpen).toBe(true);

      // Then close it
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it("should remain false if called when already closed", () => {
      const { result } = renderHook(() => useAboutModalOpen());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  // ============================================================================
  // State Transitions Tests
  // ============================================================================

  describe("state transitions", () => {
    it("should toggle between open and closed states", () => {
      const { result } = renderHook(() => useAboutModalOpen());

      // Initial state
      expect(result.current.isOpen).toBe(false);

      // Open
      act(() => {
        result.current.openModal();
      });
      expect(result.current.isOpen).toBe(true);

      // Close
      act(() => {
        result.current.closeModal();
      });
      expect(result.current.isOpen).toBe(false);

      // Open again
      act(() => {
        result.current.openModal();
      });
      expect(result.current.isOpen).toBe(true);
    });
  });
});
