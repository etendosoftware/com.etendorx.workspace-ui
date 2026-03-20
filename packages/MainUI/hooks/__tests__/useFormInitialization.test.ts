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

import { renderHook, waitFor, act } from "@testing-library/react";
import { useFormInitialization } from "../useFormInitialization";
import { useTabContext } from "@/contexts/tab";
import { useUserContext } from "../useUserContext";
import { useCurrentRecord } from "../useCurrentRecord";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import {
  fetchFormInitialization,
  buildFormInitializationParams,
  buildFormInitializationPayload,
} from "@/utils/hooks/useFormInitialization/utils";

jest.mock("@/contexts/tab");
jest.mock("../useUserContext");
jest.mock("../useCurrentRecord");
jest.mock("../useFormParent", () => jest.fn(() => ({ parentField: "parentVal" })));
jest.mock("@/utils/hooks/useFormInitialization/utils");
jest.mock("@/utils/logger");

describe("useFormInitialization", () => {
  const mockTab = {
    id: "tabId",
    fields: {
      id: { column: { keyColumn: true } }
    }
  } as any;

  const mockSetSession = jest.fn();
  const mockSetSessionSyncLoading = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ parentRecord: { id: "p1" } });
    (useUserContext as jest.Mock).mockReturnValue({
      setSession: mockSetSession,
      setSessionSyncLoading: mockSetSessionSyncLoading,
    });
    (useCurrentRecord as jest.Mock).mockReturnValue({ record: null, loading: false });
    (buildFormInitializationParams as jest.Mock).mockReturnValue(new URLSearchParams("p=1"));
    (buildFormInitializationPayload as jest.Mock).mockReturnValue({});
  });

  it("should start in loading state", () => {
    (fetchFormInitialization as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useFormInitialization({ tab: mockTab, mode: FormMode.NEW }));
    expect(result.current.loading).toBe(true);
  });

  it("should fetch form initialization on mount", async () => {
    const mockData = { auxiliaryInputValues: {} };
    (fetchFormInitialization as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useFormInitialization({ tab: mockTab, mode: FormMode.NEW }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchFormInitialization).toHaveBeenCalled();
    expect(result.current.formInitialization).toEqual(mockData);
  });

  it("should handle fetch error", async () => {
    const mockError = new Error("Fetch failed");
    (fetchFormInitialization as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useFormInitialization({ tab: mockTab, mode: FormMode.NEW }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(mockError);
  });

  it("should enrich with audit fields when in EDIT mode", async () => {
    const mockRecord = {
      creationDate: "2023-01-01",
      createdBy$_identifier: "User1",
      updated: "2023-01-02",
      updatedBy$_identifier: "User2",
    };
    (useCurrentRecord as jest.Mock).mockReturnValue({ record: mockRecord, loading: false });
    
    const mockData = { auxiliaryInputValues: {} };
    (fetchFormInitialization as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useFormInitialization({ tab: mockTab, mode: FormMode.EDIT, recordId: "r1" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.formInitialization).toEqual(expect.objectContaining({
      creationDate: "2023-01-01",
      createdBy$_identifier: "User1",
    }));
  });

  it("should refetch when manually triggered", async () => {
    (fetchFormInitialization as jest.Mock).mockResolvedValue({ auxiliaryInputValues: {} });

    const { result } = renderHook(() => useFormInitialization({ tab: mockTab, mode: FormMode.NEW }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    jest.clearAllMocks();

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchFormInitialization).toHaveBeenCalledTimes(1);
  });
});
