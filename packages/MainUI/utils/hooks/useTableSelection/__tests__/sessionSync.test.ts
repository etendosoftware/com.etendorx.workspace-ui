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

import { syncSelectedRecordsToSession } from "../sessionSync";
import { fetchFormInitialization } from "@/utils/hooks/useFormInitialization/utils";
import type { Tab, EntityData } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("@/utils/hooks/useFormInitialization/utils", () => ({
  fetchFormInitialization: jest.fn(),
  buildFormInitializationParams: jest.fn(),
  buildFormInitializationPayload: jest.fn().mockReturnValue({}),
  buildSessionAttributes: jest.fn().mockReturnValue({}),
}));

jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("syncSelectedRecordsToSession", () => {
  const mockTab = {
    id: "tab1",
    entityName: "TestEntity",
    window: "window1",
    fields: {
      testField: {
        column: {
          keyColumn: true,
          columnName: "testId",
        },
        inputName: "inpTestId",
      },
    },
  } as unknown as Tab;

  const mockSetSession = jest.fn();
  const mockSetSessionSyncLoading = jest.fn();
  const windowIdentifier = "window-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchFormInitialization as jest.Mock).mockResolvedValue({});
  });

  it("should send request on first call", async () => {
    const selectedRecords = [{ id: "record1" }] as EntityData[];

    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords,
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
      windowIdentifier,
    });

    expect(fetchFormInitialization).toHaveBeenCalledTimes(1);
    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(true);
    expect(mockSetSessionSyncLoading).toHaveBeenCalledWith(false);
  });

  it("should not send request on subsequent calls with same selection", async () => {
    const selectedRecords = [{ id: "record2" }] as EntityData[];
    const windowId = "window-test-cache-1";

    // First call
    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords,
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
      windowIdentifier: windowId,
    });

    expect(fetchFormInitialization).toHaveBeenCalledTimes(1);

    // Second call with same selection
    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords,
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
      windowIdentifier: windowId,
    });

    // Should still be 1
    expect(fetchFormInitialization).toHaveBeenCalledTimes(1);
  });

  it("should send request when selection changes", async () => {
    const windowId = "window-test-cache-2";
    
    // First call
    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: [{ id: "record3" }] as EntityData[],
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
      windowIdentifier: windowId,
    });

    expect(fetchFormInitialization).toHaveBeenCalledTimes(1);

    // Second call with different selection
    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords: [{ id: "record4" }] as EntityData[],
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
      windowIdentifier: windowId,
    });

    // Should be 2 now
    expect(fetchFormInitialization).toHaveBeenCalledTimes(2);
  });

  it("should send request when windowIdentifier changes", async () => {
    const selectedRecords = [{ id: "record5" }] as EntityData[];
    
    // First call with window A
    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords,
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
      windowIdentifier: "window-A",
    });

    expect(fetchFormInitialization).toHaveBeenCalledTimes(1);

    // Second call with window B (same records)
    await syncSelectedRecordsToSession({
      tab: mockTab,
      selectedRecords,
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
      windowIdentifier: "window-B",
    });

    // Should be 2 now because it's a different window context
    expect(fetchFormInitialization).toHaveBeenCalledTimes(2);
  });
});
