import { renderHook, act } from "@testing-library/react";
import { useTableDirDatasource } from "../useTableDirDatasource";
import { useTabContext } from "@/contexts/tab";
import { useFormContext } from "react-hook-form";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { ProcessSelectorContext } from "@/hooks/types";

jest.mock("@/contexts/tab");
jest.mock("react-hook-form");
jest.mock("@/hooks/useFormParent", () => ({ __esModule: true, default: jest.fn(() => ({})) }));
jest.mock("@/hooks/useUserContext", () => ({ useUserContext: jest.fn(() => ({ currentWarehouse: null })) }));
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { client: { post: jest.fn() } },
}));
jest.mock("@/utils/logger");

const FIELD_ID = "F572144B1ABF4C31B971DC0B0108F91B";
const PROCESS_ID = "60F1E2DEB1B544908CDD4CF99ACA80EB";
const COLUMN_NAME = "payment_method";
const FIN_PAYMENT_METHOD_DATASOURCE = "FIN_PaymentMethod";
const SELECTOR_FILTER_CLASS = "org.openbravo.userinterface.selector.SelectorDataSourceFilter";

const mockField = {
  id: FIELD_ID,
  hqlName: COLUMN_NAME,
  columnName: COLUMN_NAME,
  name: "Payment Method",
  selector: {
    datasourceName: FIN_PAYMENT_METHOD_DATASOURCE,
    filterClass: SELECTOR_FILTER_CLASS,
  },
} as any;

const buildProcessContext = (
  values: Record<string, unknown> = { payment_method: "X", received_in: true, ad_org_id: "0" }
): ProcessSelectorContext => ({ processId: PROCESS_ID, values: values as Record<string, any> });

const getLastPostedParams = (): Record<string, any> => {
  const calls = (datasource.client.post as jest.Mock).mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][1].params as Record<string, any>;
};

describe("useTableDirDatasource — process selector overlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: null, parentTab: null, parentRecord: null });
    (useFormContext as jest.Mock).mockReturnValue({
      watch: jest.fn(),
      getValues: jest.fn(() => ({})),
    });
    (datasource.client.post as jest.Mock).mockResolvedValue({
      data: { response: { data: [] } },
    });
  });

  it("emits the full process overlay when processContext is provided", async () => {
    const processContext = buildProcessContext();
    const { result } = renderHook(() =>
      useTableDirDatasource({ field: mockField, isProcessModal: true, processContext })
    );

    await act(async () => {
      await result.current.refetch();
    });

    const params = getLastPostedParams();
    // Raw process-parameter keys from `values`
    expect(params.payment_method).toBe("X");
    expect(params.received_in).toBe(true);
    expect(params.ad_org_id).toBe("0");
    // Meta keys mirrored from Classic's `prepareDSRequest`
    expect(params._processDefinitionId).toBe(PROCESS_ID);
    expect(params._selectorFieldId).toBe(FIELD_ID);
    expect(params.columnName).toBe(COLUMN_NAME);
    expect(params.IsSelectorItem).toBe(true);
    // Org aliases derived from ad_org_id
    expect(params._org).toBe("0");
    expect(params.inpadOrgId).toBe("0");
  });

  it("omits org aliases when ad_org_id is missing", async () => {
    const processContext = buildProcessContext({ payment_method: "X" });
    const { result } = renderHook(() =>
      useTableDirDatasource({ field: mockField, isProcessModal: true, processContext })
    );

    await act(async () => {
      await result.current.refetch();
    });

    const params = getLastPostedParams();
    expect(params._org).toBeUndefined();
    expect(params.inpadOrgId).toBeUndefined();
  });

  it("does NOT emit overlay keys when processContext is absent (process modal regression guard)", async () => {
    const { result } = renderHook(() => useTableDirDatasource({ field: mockField, isProcessModal: true }));

    await act(async () => {
      await result.current.refetch();
    });

    const params = getLastPostedParams();
    expect(params._processDefinitionId).toBeUndefined();
    expect(params._selectorFieldId).toBeUndefined();
    expect(params.IsSelectorItem).toBeUndefined();
    expect(params.columnName).toBeUndefined();
  });

  it("does NOT emit overlay keys for standard-window selectors (isProcessModal=false)", async () => {
    // Even if a caller mistakenly passes processContext outside the process modal,
    // the guard `isProcessModal && processContext` keeps the overlay disabled.
    const processContext = buildProcessContext();
    const { result } = renderHook(() =>
      useTableDirDatasource({ field: mockField, isProcessModal: false, processContext })
    );

    await act(async () => {
      await result.current.refetch();
    });

    const params = getLastPostedParams();
    expect(params._processDefinitionId).toBeUndefined();
    expect(params._selectorFieldId).toBeUndefined();
    expect(params.IsSelectorItem).toBeUndefined();
  });
});
