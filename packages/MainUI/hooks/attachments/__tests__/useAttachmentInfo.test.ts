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
import { useAttachmentInfo } from "../useAttachmentInfo";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Tab, EntityData } from "@workspaceui/api-client/src/api/types";

// Mock Metadata
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    kernelClient: {
      post: jest.fn(),
    },
  },
}));

describe("useAttachmentInfo", () => {
  const mockTab = {
    id: "tab1",
    fields: {},
  } as unknown as Tab;

  const mockRecord = {
    id: "record1",
  } as EntityData;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the module-level cache by calling clearCache from the hook
    const { result } = renderHook(() => useAttachmentInfo());
    act(() => {
      result.current.clearCache();
    });
  });

  it("should fetch attachment info when not in cache", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        attachmentExists: true,
        attachmentCount: 5,
      },
    });

    const { result } = renderHook(() => useAttachmentInfo());

    let info;
    await act(async () => {
      info = await result.current.fetchAttachmentInfo(mockRecord, mockTab);
    });

    expect(info).toEqual({
      attachmentExists: true,
      attachmentCount: 5,
    });
    expect(Metadata.kernelClient.post).toHaveBeenCalledTimes(1);
  });

  it("should use cached attachment info on subsequent calls", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        attachmentExists: true,
        attachmentCount: 5,
      },
    });

    const { result, unmount } = renderHook(() => useAttachmentInfo());

    // First call to populate cache
    await act(async () => {
      await result.current.fetchAttachmentInfo(mockRecord, mockTab);
    });

    expect(Metadata.kernelClient.post).toHaveBeenCalledTimes(1);
    unmount();

    // Second call with same params (new hook instance)
    const { result: result2 } = renderHook(() => useAttachmentInfo());
    let info2;
    await act(async () => {
      info2 = await result2.current.fetchAttachmentInfo(mockRecord, mockTab);
    });

    expect(info2).toEqual({
      attachmentExists: true,
      attachmentCount: 5,
    });
    // Should still be 1 because it's cached at module level
    expect(Metadata.kernelClient.post).toHaveBeenCalledTimes(1);
  });

  it("should fetch new info when record changes", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        attachmentExists: false,
        attachmentCount: 0,
      },
    });

    const { result } = renderHook(() => useAttachmentInfo());

    // First call
    await act(async () => {
      await result.current.fetchAttachmentInfo(mockRecord, mockTab);
    });

    expect(Metadata.kernelClient.post).toHaveBeenCalledTimes(1);

    // Second call with different record
    const mockRecord2 = { id: "record2" } as EntityData;
    await act(async () => {
      await result.current.fetchAttachmentInfo(mockRecord2, mockTab);
    });

    expect(Metadata.kernelClient.post).toHaveBeenCalledTimes(2);
  });
});
