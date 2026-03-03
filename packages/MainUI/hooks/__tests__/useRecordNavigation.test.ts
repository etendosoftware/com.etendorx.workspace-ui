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

import { renderHook, act, waitFor } from "@testing-library/react";
import { useRecordNavigation } from "../useRecordNavigation";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { FormState } from "react-hook-form";

describe("useRecordNavigation", () => {
  const mockRecords: EntityData[] = [
    { id: "1", name: "Record 1" },
    { id: "2", name: "Record 2" },
    { id: "3", name: "Record 3" },
  ];

  const mockFormState = {
    isDirty: false,
  } as FormState<EntityData>;

  const mockHandleSave = jest.fn();
  const mockShowErrorModal = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockFetchMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("navigationState", () => {
    it("should calculate correct navigation state for middle record", () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: "2",
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
        })
      );

      expect(result.current.navigationState).toEqual({
        canNavigateNext: true,
        canNavigatePrevious: true,
        currentIndex: 1,
        totalRecords: 3,
      });
    });

    it("should disable previous navigation for first record", () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: "1",
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
        })
      );

      expect(result.current.navigationState.canNavigatePrevious).toBe(false);
      expect(result.current.navigationState.canNavigateNext).toBe(true);
    });

    it("should disable next navigation for last record when no more records available", () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: "3",
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
          hasMoreRecords: false,
        })
      );

      expect(result.current.navigationState.canNavigateNext).toBe(false);
      expect(result.current.navigationState.canNavigatePrevious).toBe(true);
    });

    it("should enable next navigation for last record when more records available", () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: "3",
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
          hasMoreRecords: true,
          fetchMore: mockFetchMore,
        })
      );

      expect(result.current.navigationState.canNavigateNext).toBe(true);
    });

    it("should disable all navigation for NEW_RECORD_ID", () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: "NEW",
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
        })
      );

      expect(result.current.navigationState).toEqual({
        canNavigateNext: false,
        canNavigatePrevious: false,
        currentIndex: -1,
        totalRecords: 3,
      });
    });

    it("should disable all navigation when records array is empty", () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: "1",
          records: [],
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
        })
      );

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
  ])("navigate$direction", ({ navFn, startRecordId, expectedTargetId, boundaryRecordId, boundaryTestName }) => {
    it(`should navigate to ${navFn === "navigateToNext" ? "next" : "previous"} record without saving when form is not dirty`, async () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: startRecordId,
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
        })
      );

      await act(async () => {
        await result.current[navFn]();
      });

      expect(mockHandleSave).not.toHaveBeenCalled();
      expect(mockOnNavigate).toHaveBeenCalledWith(expectedTargetId);
    });

    it(`should autosave before navigating to ${navFn === "navigateToNext" ? "next" : "previous"} when form is dirty`, async () => {
      const dirtyFormState = { isDirty: true } as FormState<EntityData>;
      mockHandleSave.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: startRecordId,
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: dirtyFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
        })
      );

      await act(async () => {
        await result.current[navFn]();
      });

      await waitFor(() => {
        expect(mockHandleSave).toHaveBeenCalledWith({ showModal: true });
        expect(mockOnNavigate).toHaveBeenCalledWith(expectedTargetId);
      });
    });

    it("should block navigation when autosave fails", async () => {
      const dirtyFormState = { isDirty: true } as FormState<EntityData>;
      const saveError = "Validation error";
      mockHandleSave.mockRejectedValue(saveError);

      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: startRecordId,
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: dirtyFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
        })
      );

      await act(async () => {
        await result.current[navFn]();
      });

      await waitFor(() => {
        expect(mockHandleSave).toHaveBeenCalledWith({ showModal: true });
        expect(mockShowErrorModal).toHaveBeenCalled();
        expect(mockOnNavigate).not.toHaveBeenCalled();
      });
    });

    it(boundaryTestName, async () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: boundaryRecordId,
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
          hasMoreRecords: navFn === "navigateToNext" ? false : undefined,
        })
      );

      await act(async () => {
        await result.current[navFn]();
      });

      expect(mockOnNavigate).not.toHaveBeenCalled();
    });
  });

  describe("isNavigating flag", () => {
    it("should be false initially and after navigation completes", async () => {
      const { result } = renderHook(() =>
        useRecordNavigation({
          currentRecordId: "1",
          records: mockRecords,
          onNavigate: mockOnNavigate,
          formState: mockFormState,
          handleSave: mockHandleSave,
          showErrorModal: mockShowErrorModal,
        })
      );

      // Initially should be false
      expect(result.current.isNavigating).toBe(false);

      await act(async () => {
        await result.current.navigateToNext();
      });

      // After navigation completes, should be false again
      expect(result.current.isNavigating).toBe(false);
    });
  });
});
