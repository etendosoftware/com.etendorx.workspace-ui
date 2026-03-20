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
import { useDeleteRecord } from "../useDeleteRecord";
import { useUserContext } from "../useUserContext";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useTranslation } from "../useTranslation";
import { buildSingleDeleteQueryString } from "@/utils";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { useToolbarContext } from "@/contexts/ToolbarContext";

jest.mock("../useUserContext");
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    datasourceServletClient: { request: jest.fn() },
    kernelClient: { post: jest.fn() },
  },
}));
jest.mock("../useTranslation");
jest.mock("@/utils");
jest.mock("@/contexts/TabRefreshContext");
jest.mock("@/contexts/ToolbarContext");

describe("useDeleteRecord", () => {
  const mockTab = {
    entityName: "Entity",
    tabLevel: 0,
  } as any;

  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockLogout = jest.fn();
  const mockOnBack = jest.fn();
  const mockTriggerParentRefreshes = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUserContext as jest.Mock).mockReturnValue({
      user: { id: "u1" },
      logout: mockLogout,
      setLoginErrorText: jest.fn(),
      setLoginErrorDescription: jest.fn(),
    });
    (useTranslation as jest.Mock).mockReturnValue({ t: (k: string) => k });
    (useTabRefreshContext as jest.Mock).mockReturnValue({ triggerParentRefreshes: mockTriggerParentRefreshes });
    (useToolbarContext as jest.Mock).mockReturnValue({ onBack: mockOnBack });
    (buildSingleDeleteQueryString as jest.Mock).mockReturnValue("mock-query");
  });

  it("should handle single record deletion successfully", async () => {
    (Metadata.datasourceServletClient.request as jest.Mock).mockResolvedValue({
      ok: true,
      data: { response: { status: 0 } },
    });

    const { result } = renderHook(() => useDeleteRecord({
      tab: mockTab,
      onSuccess: mockOnSuccess,
    }));

    await act(async () => {
      await result.current.deleteRecord({ id: "r1" });
    });

    expect(Metadata.datasourceServletClient.request).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalledWith(1);
    expect(result.current.loading).toBe(false);
  });

  it("should handle single record deletion failure", async () => {
    (Metadata.datasourceServletClient.request as jest.Mock).mockResolvedValue({
      ok: false,
      data: { response: { error: { message: "Error message" } } },
    });

    const { result } = renderHook(() => useDeleteRecord({
      tab: mockTab,
      onError: mockOnError,
    }));

    await act(async () => {
      await result.current.deleteRecord({ id: "r1" });
    });

    expect(mockOnError).toHaveBeenCalledWith({ errorMessage: "Error message" });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("should handle logout and CSRF error", async () => {
    (Metadata.datasourceServletClient.request as jest.Mock).mockResolvedValue({
      ok: false,
      data: { response: { error: { message: "InvalidCSRFToken" } } },
    });

    const { result } = renderHook(() => useDeleteRecord({
      tab: mockTab,
      onError: mockOnError,
    }));

    await act(async () => {
      await result.current.deleteRecord({ id: "r1" });
    });

    expect(mockLogout).toHaveBeenCalled();
  });
});
