import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useInlineCallout } from "../useInlineCallout";
import { globalCalloutManager } from "@/services/callouts";

jest.mock("sonner", () => ({
  toast: { error: jest.fn() },
}));
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    kernelClient: { post: jest.fn() },
  },
}));
jest.mock("@/utils/logger");
jest.mock("@/utils/debug", () => ({ isDebugCallouts: () => false }));
jest.mock("@/utils", () => ({
  buildPayloadByInputName: jest.fn(() => ({ inpField1: "newVal" })),
}));
jest.mock("@workspaceui/api-client/src/utils/metadata", () => ({
  getFieldsByColumnName: jest.fn(() => ({
    entityKeyCol: { inputName: "inpKeyName" },
  })),
}));
jest.mock("@/services/callouts", () => ({
  globalCalloutManager: {
    isSuppressed: jest.fn(() => false),
    executeCallout: jest.fn((_name: string, fn: () => Promise<void>) => fn()),
    suppress: jest.fn(),
    resume: jest.fn(),
  },
}));

const mockTab = {
  id: "tab1",
  table: "table1",
  entityName: "TestEntity",
  window: "window1",
  fields: {
    id: { columnName: "entityKeyCol" },
    field1: { column: { dbColumnName: "field1", entityKey: false }, inputName: "inpField1" },
  },
} as any;

const mockField = {
  inputName: "inpField1",
  hqlName: "field1",
  column: { callout: "SomeCallout", entityKey: false },
} as any;

describe("useInlineCallout – error detection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalCalloutManager.isSuppressed as jest.Mock).mockReturnValue(false);
    (globalCalloutManager.executeCallout as jest.Mock).mockImplementation((_name: string, fn: () => Promise<void>) =>
      fn()
    );
  });

  it("should show toast and not apply values when backend returns status -1", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { response: { status: -1, error: { message: "Inline validation failed" } } },
    });

    const mockOnApply = jest.fn();
    const { result } = renderHook(() =>
      useInlineCallout({
        field: mockField,
        tab: mockTab,
        rowId: "row1",
        parentId: "parent1",
        session: { inpRole: "role1" },
        currentRowData: { inpField1: "oldVal" },
        onApplyCalloutValues: mockOnApply,
      })
    );

    await act(async () => {
      await result.current("newVal");
    });

    expect(toast.error).toHaveBeenCalledWith("Inline validation failed");
    expect(mockOnApply).not.toHaveBeenCalled();
  });

  it("should apply column values and not show toast on successful callout", async () => {
    (Metadata.kernelClient.post as jest.Mock).mockResolvedValue({
      data: { columnValues: { inpField2: { value: "set-by-callout" } } },
    });

    const mockOnApply = jest.fn();
    const { result } = renderHook(() =>
      useInlineCallout({
        field: mockField,
        tab: mockTab,
        rowId: "row1",
        session: { inpRole: "role1" },
        currentRowData: { inpField1: "oldVal" },
        onApplyCalloutValues: mockOnApply,
      })
    );

    await act(async () => {
      await result.current("newVal");
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(mockOnApply).toHaveBeenCalledWith({ inpField2: { value: "set-by-callout" } });
  });
});
