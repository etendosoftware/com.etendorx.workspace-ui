import { renderHook, act } from "@testing-library/react";
import { useTableDirDatasource } from "../useTableDirDatasource";
import { useTabContext } from "@/contexts/tab";
import { useFormContext } from "react-hook-form";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { Field } from "@workspaceui/api-client/src/api/types";
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
const SELECTOR_DEF_ID = "7875FD8CEC604CB3AF3ABDF9D9024CA3";
const COMBO_TABLE_DATASOURCE = "ComboTableDatasourceService";

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

describe("useTableDirDatasource — _selectorDefinitionId forwarding", () => {
  // An OBUISEL selector (e.g. "Order for invoicing" on C_Order) is filtered server-side
  // by SelectorDataSourceFilter, which is a no-op unless the request carries
  // `_selectorDefinitionId`. The hook must forward it for process selectors.
  const ORDER_DATASOURCE = "C_Order";

  const buildField = (selector: Record<string, unknown>): Field =>
    ({
      id: FIELD_ID,
      hqlName: COLUMN_NAME,
      columnName: COLUMN_NAME,
      name: "Sales Order",
      selector,
    }) as unknown as Field;

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

  it("forwards _selectorDefinitionId for a custom-entity selector (Order for invoicing)", async () => {
    const field = buildField({
      datasourceName: ORDER_DATASOURCE,
      filterClass: SELECTOR_FILTER_CLASS,
      _selectorDefinitionId: SELECTOR_DEF_ID,
    });
    const { result } = renderHook(() =>
      useTableDirDatasource({ field, isProcessModal: true, processContext: buildProcessContext() })
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(getLastPostedParams()._selectorDefinitionId).toBe(SELECTOR_DEF_ID);
  });

  it("does NOT add _selectorDefinitionId for a standard combo without a selector id", async () => {
    const field = buildField({ datasourceName: COMBO_TABLE_DATASOURCE });
    const { result } = renderHook(() =>
      useTableDirDatasource({ field, isProcessModal: true, processContext: buildProcessContext() })
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(getLastPostedParams()._selectorDefinitionId).toBeUndefined();
  });

  it("omits empty tab/table ids so the backend does not look up a null Tab (NPE guard)", async () => {
    // A process selector has no window tab (useTabContext → tab: null, field.tab absent).
    // Sending tabId:"" makes the backend fetch Tab by "" → null → NPE in
    // getWhereAndFilterClause. The keys must be absent, not empty.
    const field = buildField({
      datasourceName: ORDER_DATASOURCE,
      filterClass: SELECTOR_FILTER_CLASS,
      _selectorDefinitionId: SELECTOR_DEF_ID,
    });
    const { result } = renderHook(() =>
      useTableDirDatasource({ field, isProcessModal: true, processContext: buildProcessContext() })
    );

    await act(async () => {
      await result.current.refetch();
    });

    const params = getLastPostedParams();
    expect(params.tabId).toBeUndefined();
    expect(params.inpTabId).toBeUndefined();
    expect(params.inpTableId).toBeUndefined();
  });

  it("omits _processDefinitionId/_selectorFieldId for a classic (numeric-id) process", async () => {
    // Classic AD_Process (e.g. Generate Invoices id 119) has no OBUIAPP process
    // definition. Sending these keys makes SelectorDataSourceFilter NPE on a
    // missing Parameter and the servlet then drops the selector where clause.
    const field = buildField({
      datasourceName: ORDER_DATASOURCE,
      filterClass: SELECTOR_FILTER_CLASS,
      _selectorDefinitionId: SELECTOR_DEF_ID,
    });
    const classicContext: ProcessSelectorContext = { processId: "119", values: { ad_org_id: "0" } };
    const { result } = renderHook(() =>
      useTableDirDatasource({ field, isProcessModal: true, processContext: classicContext })
    );

    await act(async () => {
      await result.current.refetch();
    });

    const params = getLastPostedParams();
    expect(params._processDefinitionId).toBeUndefined();
    expect(params._selectorFieldId).toBeUndefined();
    // The selector id still goes through so the backend applies its where clause.
    expect(params._selectorDefinitionId).toBe(SELECTOR_DEF_ID);
    // Harmless selector-item markers are still sent.
    expect(params.IsSelectorItem).toBe(true);
  });

  it("keeps _processDefinitionId/_selectorFieldId for an OBUIAPP (UUID) process", async () => {
    const field = buildField({
      datasourceName: ORDER_DATASOURCE,
      filterClass: SELECTOR_FILTER_CLASS,
      _selectorDefinitionId: SELECTOR_DEF_ID,
    });
    const { result } = renderHook(() =>
      useTableDirDatasource({ field, isProcessModal: true, processContext: buildProcessContext() })
    );

    await act(async () => {
      await result.current.refetch();
    });

    const params = getLastPostedParams();
    expect(params._processDefinitionId).toBe(PROCESS_ID);
    expect(params._selectorFieldId).toBe(FIELD_ID);
  });
});
