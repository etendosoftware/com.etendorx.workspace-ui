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
import { useFormInitialization } from "../useFormInitialization";
import { useUserContext } from "../useUserContext";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import { fetchFormInitialization, buildFormInitializationParams } from "../../utils/hooks/useFormInitialization/utils";

// Mock dependencies
jest.mock("../useUserContext");
jest.mock("../../contexts/tab", () => ({
  useTabContext: () => ({ parentRecord: null }),
}));
jest.mock("../useCurrentRecord", () => ({
  useCurrentRecord: jest.fn(() => ({ record: null, loading: false })),
}));
jest.mock("../useFormParent", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));
jest.mock("../../utils/hooks/useFormInitialization/utils");

const mockUseUserContext = useUserContext as jest.MockedFunction<typeof useUserContext>;
const mockFetchFormInitialization = fetchFormInitialization as jest.MockedFunction<typeof fetchFormInitialization>;
const mockBuildFormInitializationParams = buildFormInitializationParams as jest.MockedFunction<
  typeof buildFormInitializationParams
>;

// Create minimal mock tab
const mockTab = {
  id: "test-tab-id",
  fields: {
    testId: {
      column: { keyColumn: "Y" },
    },
  },
} as never;

describe("useFormInitialization loading state", () => {
  let mockSetSession: jest.Mock;
  let mockSetSessionSyncLoading: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSetSession = jest.fn();
    mockSetSessionSyncLoading = jest.fn();

    // Mock useUserContext with minimal required properties
    mockUseUserContext.mockReturnValue({
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
    } as never);

    // Mock successful params build - ensure it returns a valid URLSearchParams
    mockBuildFormInitializationParams.mockReturnValue(new URLSearchParams("test=value"));

    // Mock successful fetch
    mockFetchFormInitialization.mockResolvedValue({
      auxiliaryInputValues: {},
      columnValues: {},
      sessionAttributes: {},
      dynamicCols: [],
      attachmentExists: false,
    });
  });

  test("should set loading state during fetch operation", async () => {
    const { result } = renderHook(() =>
      useFormInitialization({
        tab: mockTab,
        mode: FormMode.EDIT,
        recordId: "test-record-id",
      })
    );

    // Wait for any initial renders to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Clear any calls from initial render
    mockSetSessionSyncLoading.mockClear();

    await act(async () => {
      await result.current.refetch();
    });

    // Verify loading state was set to true at the beginning
    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(true);
    // Verify loading state was reset to false at the end
    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(false);
    // Verify it was called exactly twice (true then false)
    expect(mockSetSessionSyncLoading).toHaveBeenCalledTimes(2);
  }, 5000);

  test("should reset loading state on error", async () => {
    const testError = new Error("Test error");
    mockFetchFormInitialization.mockRejectedValue(testError);

    const { result } = renderHook(() =>
      useFormInitialization({
        tab: mockTab,
        mode: FormMode.EDIT,
        recordId: "test-record-id",
      })
    );

    // Wait for initial effect to settle and clear calls
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    mockSetSessionSyncLoading.mockClear();

    await act(async () => {
      await result.current.refetch();
    });

    // Verify loading state was set and then reset even on error
    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(true);
    expect(mockSetSessionSyncLoading).toHaveBeenLastCalledWith(false);
    expect(mockSetSessionSyncLoading).toHaveBeenCalledTimes(2);
  });

  test("should reset loading state on missing key column error", async () => {
    const tabWithoutKeyColumn = {
      id: "test-tab-id",
      fields: {
        testField: {
          column: { keyColumn: "N" },
        },
      },
    } as never;

    const { result } = renderHook(() =>
      useFormInitialization({
        tab: tabWithoutKeyColumn,
        mode: FormMode.EDIT,
        recordId: "test-record-id",
      })
    );

    // Wait for initial effect to settle and clear calls
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    mockSetSessionSyncLoading.mockClear();

    await act(async () => {
      await result.current.refetch();
    });

    // Verify loading state was set and then reset even when key column is missing
    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(true);
    expect(mockSetSessionSyncLoading).toHaveBeenLastCalledWith(false);
    expect(mockSetSessionSyncLoading).toHaveBeenCalledTimes(2);
  });

  test("should not call loading functions when params are null", async () => {
    mockBuildFormInitializationParams.mockReturnValueOnce(null as never);

    const { result } = renderHook(() =>
      useFormInitialization({
        tab: null as never,
        mode: FormMode.EDIT,
        recordId: "test-record-id",
      })
    );

    await act(async () => {
      await result.current.refetch();
    });

    // Verify loading functions were not called when params are null
    expect(mockSetSessionSyncLoading).not.toHaveBeenCalled();
    expect(mockFetchFormInitialization).not.toHaveBeenCalled();
  });
});
