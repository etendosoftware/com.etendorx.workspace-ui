import { act, renderHook } from "@testing-library/react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { fetchFormInitialization } from "@/utils/hooks/useFormInitialization/utils";
import { clearRecordContextFromSession } from "@/utils/hooks/useTableSelection/sessionSync";
import { useInlineEditInitialization } from "../useInlineEditInitialization";

jest.mock("@/utils/hooks/useFormInitialization/utils", () => ({
  ...jest.requireActual("@/utils/hooks/useFormInitialization/utils"),
  fetchFormInitialization: jest.fn(),
}));

jest.mock("@/utils/hooks/useTableSelection/sessionSync", () => ({
  clearRecordContextFromSession: jest.fn(),
}));

let mockParentRecord: Record<string, unknown> | undefined;
jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({ parentRecord: mockParentRecord }),
}));

jest.mock("@/hooks/useFormParent", () => ({
  __esModule: true,
  default: (name: string) => (name === "inputName" ? { inpcOrderId: "ORDER" } : { salesOrder: "ORDER" }),
}));

const mockSetSession = jest.fn();
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: { setSession: jest.Mock }) => unknown) => selector({ setSession: mockSetSession }),
}));

const fetchFIC = fetchFormInitialization as jest.Mock;

const tab = {
  id: "TAB",
  table: "TABLE",
  window: "WIN",
  entityName: "OrderLine",
  fields: {
    id: { hqlName: "id", inputName: "inpcOrderlineId", columnName: "C_OrderLine_ID", column: { keyColumn: true } },
    active: { hqlName: "active", inputName: "inpisactive", columnName: "IsActive", column: { reference: "20" } },
    product: { hqlName: "product", inputName: "inpmProductId", columnName: "M_Product_ID", column: {} },
  },
} as unknown as Tab;

const ficResponse = {
  columnValues: {
    IsActive: { value: "Y" },
    M_Product_ID: { value: "P1", identifier: "Product 1" },
  },
  auxiliaryInputValues: {},
  sessionAttributes: { "#Session": "S" },
};

describe("useInlineEditInitialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParentRecord = undefined;
    fetchFIC.mockResolvedValue(ficResponse);
  });

  it("starts a new root row like the form: session reset, values mapped by hqlName, parent data", async () => {
    const { result } = renderHook(() => useInlineEditInitialization({ tab }));

    let data: Record<string, unknown> | null = null;
    await act(async () => {
      data = await result.current.fetchInitialData("new_1", true);
    });

    expect(clearRecordContextFromSession).toHaveBeenCalledWith({ tab, parentId: undefined });
    const [params] = fetchFIC.mock.calls[0];
    expect(params.get("MODE")).toBe("NEW");
    expect(data).toMatchObject({
      active: true,
      product: "P1",
      product$_identifier: "Product 1",
      salesOrder: "ORDER",
      "#Session": "S",
    });
    expect(mockSetSession).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("sends the record's values in EDIT and skips the session reset of child rows", async () => {
    mockParentRecord = { id: "ORDER" };
    const { result } = renderHook(() => useInlineEditInitialization({ tab }));

    await act(async () => {
      await result.current.fetchInitialData("LINE1", false, { id: "LINE1", product: "P9" });
    });

    expect(clearRecordContextFromSession).not.toHaveBeenCalled();
    const [params, payload] = fetchFIC.mock.calls[0];
    expect(params.get("MODE")).toBe("EDIT");
    expect(params.get("ROW_ID")).toBe("LINE1");
    expect(params.get("PARENT_ID")).toBe("ORDER");
    expect(payload).toMatchObject({ inpmProductId: "P9", inpcOrderId: "ORDER" });
  });

  it("returns null and keeps the error when the tab has no key column or the request fails", async () => {
    const noKeyTab = { ...tab, fields: { product: tab.fields.product } } as unknown as Tab;
    const { result: noKey } = renderHook(() => useInlineEditInitialization({ tab: noKeyTab }));
    let data: unknown = "unset";
    await act(async () => {
      data = await noKey.current.fetchInitialData("new_1", true);
    });
    expect(data).toBeNull();
    expect(noKey.current.error?.message).toMatch(/key column/);

    fetchFIC.mockRejectedValue("offline");
    const { result } = renderHook(() => useInlineEditInitialization({ tab }));
    await act(async () => {
      data = await result.current.fetchInitialData("new_1", true);
    });
    expect(data).toBeNull();
    expect(result.current.error?.message).toBe("Failed to fetch initialization data");
  });
});
