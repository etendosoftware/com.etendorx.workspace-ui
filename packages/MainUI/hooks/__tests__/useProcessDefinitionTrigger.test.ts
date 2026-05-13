import { renderHook, act } from "@testing-library/react";
import { useProcessDefinitionTrigger } from "../useProcessDefinitionTrigger";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    client: {
      post: jest.fn(),
    },
  },
}));

const mockPost = Metadata.client.post as jest.Mock;

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    id: "field-1",
    name: "Test Button",
    hqlName: "testButton",
    column: { reference: "28" },
    selector: { processDefinitionId: "proc-123" },
    ...overrides,
  }) as unknown as Field;

describe("useProcessDefinitionTrigger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns initial state with modal closed and no data", () => {
    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));
    expect(result.current.isProcessModalOpen).toBe(false);
    expect(result.current.processButtonData).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("fetches process definition and opens modal on triggerProcess", async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      data: { name: "My Process", id: "proc-123", javaClassName: "com.test.Process" },
    });

    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));

    await act(async () => {
      await result.current.triggerProcess("proc-123");
    });

    expect(mockPost).toHaveBeenCalledWith("meta/process/proc-123");
    expect(result.current.isProcessModalOpen).toBe(true);
    expect(result.current.processButtonData).not.toBeNull();
    expect(result.current.processButtonData?.name).toBe("My Process");
  });

  it("does nothing when processId is empty", async () => {
    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));

    await act(async () => {
      await result.current.triggerProcess("");
    });

    expect(mockPost).not.toHaveBeenCalled();
    expect(result.current.isProcessModalOpen).toBe(false);
  });

  it("closes modal and clears data on closeProcessModal", async () => {
    mockPost.mockResolvedValueOnce({
      ok: true,
      data: { name: "My Process", id: "proc-123" },
    });

    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));

    await act(async () => {
      await result.current.triggerProcess("proc-123");
    });

    expect(result.current.isProcessModalOpen).toBe(true);

    act(() => {
      result.current.closeProcessModal();
    });

    expect(result.current.isProcessModalOpen).toBe(false);
    expect(result.current.processButtonData).toBeNull();
  });

  it("handles API error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockPost.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProcessDefinitionTrigger(makeField()));

    await act(async () => {
      await result.current.triggerProcess("proc-123");
    });

    expect(result.current.isProcessModalOpen).toBe(false);
    expect(result.current.processButtonData).toBeNull();
    consoleSpy.mockRestore();
  });
});
