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
import { toast } from "sonner";
import { useStatusModal } from "@/hooks/Toolbar/useStatusModal";

// Mocks
jest.mock("@/contexts/tab");
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    kernelClient: { post: jest.fn() },
  },
}));
jest.mock("@/utils/logger");
jest.mock("sonner", () => ({
  toast: { error: jest.fn() },
}));
jest.mock("@/hooks/Toolbar/useStatusModal");

describe("useCallout hook", () => {
  const mockTab = { id: "tab1" } as any;
  const mockField = { inputName: "inpField1" } as any;
  const showStatusModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab });
    (useStatusModal as jest.Mock).mockReturnValue({ showStatusModal });
  });

  it("should trigger a callout request with correct parameters", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { columnValues: { f1: "v1" } },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    const payload = { inpField1: "newVal" };

    const response = await result.current(payload);

    expect(Metadata.kernelClient.post).toHaveBeenCalledWith(expect.stringContaining("TAB_ID=tab1"), payload);
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

  it("should handle backend error status and show toast", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { response: { status: -1, error: { message: "Validation failed" } } },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    const response = await result.current({});

    expect(response).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("Validation failed");
  });

  it("should not show toast on successful callout", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { columnValues: { f1: "v1" } },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    await result.current({});

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should show separate toast for each failing callout", async () => {
    (Metadata.kernelClient.post as jest.Mock)
      .mockResolvedValueOnce({
        data: { response: { status: -1, error: { message: "Error on field A" } } },
      })
      .mockResolvedValueOnce({
        data: { response: { status: -1, error: { message: "Error on field B" } } },
      });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    await result.current({});
    await result.current({});

    expect(toast.error).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenCalledWith("Error on field A");
    expect(toast.error).toHaveBeenCalledWith("Error on field B");
  });

  it("should handle network or other errors", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useCallout({ field: mockField }));
    const response = await result.current({});

    expect(response).toBeUndefined();
  });

  it("should use changedColumnOverride as CHANGED_COLUMN when provided", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { columnValues: {} },
    });

    const { result } = renderHook(() => useCallout({ field: mockField, changedColumnOverride: "inpcBpartnerId" }));
    await result.current({});

    const calledUrl: string = (Metadata.kernelClient.post as jest.Mock).mock.calls[0][0];
    expect(calledUrl).toContain("CHANGED_COLUMN=inpcBpartnerId");
    expect(calledUrl).not.toContain("CHANGED_COLUMN=inpField1");
  });

  it("should use field.inputName as CHANGED_COLUMN when changedColumnOverride is not provided", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { columnValues: {} },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    await result.current({});

    const calledUrl: string = (Metadata.kernelClient.post as jest.Mock).mock.calls[0][0];
    expect(calledUrl).toContain("CHANGED_COLUMN=inpField1");
  });

  it("shows a non-blocking notification for a warning calloutMessage", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { columnValues: {}, calloutMessages: [{ text: "Careful", severity: "TYPE_WARNING" }] },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    await result.current({});

    expect(showStatusModal).toHaveBeenCalledWith("warning", "Careful");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows the correct severity for info and success calloutMessages", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: {
        columnValues: {},
        calloutMessages: [
          { text: "FYI", severity: "TYPE_INFO" },
          { text: "Great job", severity: "TYPE_SUCCESS" },
        ],
      },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    await result.current({});

    expect(showStatusModal).toHaveBeenNthCalledWith(1, "info", "FYI");
    expect(showStatusModal).toHaveBeenNthCalledWith(2, "success", "Great job");
  });

  it("shows all messages when the callout returns multiple", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: {
        columnValues: {},
        calloutMessages: [
          { text: "One", severity: "TYPE_INFO" },
          { text: "Two", severity: "TYPE_WARNING" },
          { text: "Three", severity: "TYPE_ERROR" },
        ],
      },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    await result.current({});

    expect(showStatusModal).toHaveBeenCalledTimes(3);
  });

  it("does not call showStatusModal when the response has no calloutMessages", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { columnValues: { f1: "v1" } },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    await result.current({});

    expect(showStatusModal).not.toHaveBeenCalled();
  });

  it("still shows the blocking toast.error for status: -1, without regression", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { response: { status: -1, error: { message: "Validation failed" } } },
    });

    const { result } = renderHook(() => useCallout({ field: mockField }));
    const response = await result.current({});

    expect(response).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("Validation failed");
    expect(showStatusModal).not.toHaveBeenCalled();
  });
});
