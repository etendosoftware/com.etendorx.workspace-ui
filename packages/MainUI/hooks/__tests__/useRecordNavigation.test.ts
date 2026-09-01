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
import { useRecordNavigation } from "../useRecordNavigation";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { GuardedTransition } from "@/contexts/UnsavedChangesTabGuard";

describe("useRecordNavigation", () => {
  const mockRecords: EntityData[] = [
    { id: "1", name: "Record 1" },
    { id: "2", name: "Record 2" },
    { id: "3", name: "Record 3" },
  ];

  const mockShowErrorModal = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockFetchMore = jest.fn();

  /** Guard for a clean form: the transition runs straight away. */
  const passThroughGuard = jest.fn((transition: GuardedTransition) => {
    transition();
  });

  /** Guard for a dirty form: it captures the transition and waits for the user. */
  const createBlockingGuard = () => {
    const captured: GuardedTransition[] = [];
    const guard = jest.fn((transition: GuardedTransition) => {
      captured.push(transition);
    });
    return { guard, captured };
  };

  type NavigationOverrides = Partial<Parameters<typeof useRecordNavigation>[0]>;

  const renderNavigation = (overrides: NavigationOverrides = {}) =>
    renderHook(() =>
      useRecordNavigation({
        currentRecordId: "2",
        records: mockRecords,
        onNavigate: mockOnNavigate,
        guardTransition: passThroughGuard,
        showErrorModal: mockShowErrorModal,
        ...overrides,
      })
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("navigationState", () => {
    it("should calculate correct navigation state for middle record", () => {
      const { result } = renderNavigation({ currentRecordId: "2" });

      expect(result.current.navigationState).toEqual({
        canNavigateNext: true,
        canNavigatePrevious: true,
        currentIndex: 1,
        totalRecords: 3,
      });
    });

    it("should disable previous navigation for first record", () => {
      const { result } = renderNavigation({ currentRecordId: "1" });

      expect(result.current.navigationState.canNavigatePrevious).toBe(false);
      expect(result.current.navigationState.canNavigateNext).toBe(true);
    });

    it("should disable next navigation for last record when no more records available", () => {
      const { result } = renderNavigation({ currentRecordId: "3", hasMoreRecords: false });

      expect(result.current.navigationState.canNavigateNext).toBe(false);
      expect(result.current.navigationState.canNavigatePrevious).toBe(true);
    });

    it("should enable next navigation for last record when more records available", () => {
      const { result } = renderNavigation({
        currentRecordId: "3",
        hasMoreRecords: true,
        fetchMore: mockFetchMore,
      });

      expect(result.current.navigationState.canNavigateNext).toBe(true);
    });

    it("should disable all navigation for NEW_RECORD_ID", () => {
      const { result } = renderNavigation({ currentRecordId: "NEW" });

      expect(result.current.navigationState).toEqual({
        canNavigateNext: false,
        canNavigatePrevious: false,
        currentIndex: -1,
        totalRecords: 3,
      });
    });

    it("should disable all navigation when records array is empty", () => {
      const { result } = renderNavigation({ currentRecordId: "1", records: [] });

      expect(result.current.navigationState).toEqual({
        canNavigateNext: false,
        canNavigatePrevious: false,
        currentIndex: -1,
        totalRecords: 0,
      });
    });
  });

  describe.each([
    {
      direction: "next" as const,
      navFn: "navigateToNext" as const,
      startRecordId: "1",
      expectedTargetId: "2",
      boundaryRecordId: "3",
      boundaryTestName: "should not navigate when already at last record and no more records",
    },
    {
      direction: "previous" as const,
      navFn: "navigateToPrevious" as const,
      startRecordId: "2",
      expectedTargetId: "1",
      boundaryRecordId: "1",
      boundaryTestName: "should not navigate when already at first record",
    },
  ])(
    "navigate$direction",
    ({ direction, navFn, startRecordId, expectedTargetId, boundaryRecordId, boundaryTestName }) => {
      it(`should navigate to the ${direction} record when the guard lets it through`, async () => {
        const { result } = renderNavigation({ currentRecordId: startRecordId });

        await act(async () => {
          result.current[navFn]();
        });

        expect(passThroughGuard).toHaveBeenCalledTimes(1);
        expect(mockOnNavigate).toHaveBeenCalledWith(expectedTargetId);
      });

      it(`should not navigate to the ${direction} record while the guard is asking the user`, async () => {
        const { guard } = createBlockingGuard();
        const { result } = renderNavigation({ currentRecordId: startRecordId, guardTransition: guard });

        await act(async () => {
          result.current[navFn]();
        });

        expect(guard).toHaveBeenCalledTimes(1);
        expect(mockOnNavigate).not.toHaveBeenCalled();
      });

      it(`should navigate to the ${direction} record once the captured transition runs`, async () => {
        const { guard, captured } = createBlockingGuard();
        const { result } = renderNavigation({ currentRecordId: startRecordId, guardTransition: guard });

        await act(async () => {
          result.current[navFn]();
        });
        await act(async () => {
          await captured[0]();
        });

        expect(mockOnNavigate).toHaveBeenCalledWith(expectedTargetId);
      });

      it(boundaryTestName, async () => {
        const { result } = renderNavigation({
          currentRecordId: boundaryRecordId,
          hasMoreRecords: navFn === "navigateToNext" ? false : undefined,
        });

        await act(async () => {
          result.current[navFn]();
        });

        expect(passThroughGuard).not.toHaveBeenCalled();
        expect(mockOnNavigate).not.toHaveBeenCalled();
      });
    }
  );

  describe("isNavigating flag", () => {
    it("should be false initially and after navigation completes", async () => {
      const { result } = renderNavigation({ currentRecordId: "1" });

      expect(result.current.isNavigating).toBe(false);

      await act(async () => {
        result.current.navigateToNext();
      });

      expect(result.current.isNavigating).toBe(false);
    });
  });
});
