/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook } from "@testing-library/react";
import { useCallout } from "../useCallout";
import { useTabContext } from "@/contexts/tab";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";

// Mocks
jest.mock("@/contexts/tab");
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    kernelClient: { post: jest.fn() },
  },
}));
jest.mock("@/utils/logger");

describe("useCallout hook", () => {
  const mockTab = { id: "tab1" } as any;
  const mockField = { inputName: "inpField1" } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab });
  });

  it("should trigger a callout request with correct parameters", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { columnValues: { f1: "v1" } },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    const payload = { inpField1: "newVal" };
    
    const response = await result.current(payload);

    expect(Metadata.kernelClient.post).toHaveBeenCalledWith(
      expect.stringContaining("TAB_ID=tab1"),
      payload
    );
    expect(response).toEqual({ columnValues: { f1: "v1" } });
  });

  it("should handle unwrapping response envelope", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { response: { columnValues: { f1: "v1" } } },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    const response = await result.current({});

    expect(response).toEqual({ columnValues: { f1: "v1" } });
  });

  it("should handle backend error status", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { response: { status: -1, error: { message: "Error" } } },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    const response = await result.current({});

    expect(response).toBeUndefined();
  });

  it("should handle network or other errors", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useCallout({ field: mockField }));
    const response = await result.current({});

    expect(response).toBeUndefined();
  });
});
