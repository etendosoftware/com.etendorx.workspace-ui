import { renderHook, waitFor } from "@testing-library/react";
import { executeStringFunction } from "@/utils/functions";
import { getPayScriptRules } from "@/components/ProcessModal/callouts/genericPayScriptCallout";
import { useWarehousePlugin } from "../useWarehousePlugin";

jest.mock("@/utils/functions");
jest.mock("@/components/ProcessModal/callouts/genericPayScriptCallout");
jest.mock("../warehouseApiHelpers", () => ({
  createCallAction: jest.fn(() => jest.fn()),
  createFetchDatasource: jest.fn(() => jest.fn()),
}));
jest.mock("@/utils/ob/obShim", () => ({ createOBShim: jest.fn(() => ({})) }));
jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ getLabel: (k: string) => k, language: "en_US" }),
}));

const executeStringFunctionMock = executeStringFunction as jest.MockedFunction<typeof executeStringFunction>;
const getPayScriptRulesMock = getPayScriptRules as jest.MockedFunction<typeof getPayScriptRules>;

const ONLOAD_CODE = "async () => ({ type: 'warehouseProcess' })";
const PROCESS_ID = "P1";

const renderPlugin = (isCustomComponent: boolean) =>
  renderHook(() =>
    useWarehousePlugin({
      processId: PROCESS_ID,
      isCustomComponent,
      onLoadCode: ONLOAD_CODE,
      onProcessCode: undefined,
      processDefinition: {},
      selectedRecords: [{ id: "R1" }],
      token: "tok",
    })
  );

describe("useWarehousePlugin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPayScriptRulesMock.mockReturnValue(undefined);
  });

  it("does not evaluate onLoad when the process is not a custom-component process", async () => {
    const { result } = renderPlugin(false);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(executeStringFunctionMock).not.toHaveBeenCalled();
    expect(result.current.schema).toBeNull();
  });

  it("evaluates onLoad exactly once and exposes the schema for a custom-component process", async () => {
    const schema = { type: "warehouseProcess", titleKey: "t" };
    executeStringFunctionMock.mockResolvedValue(schema);

    const { result } = renderPlugin(true);

    await waitFor(() => expect(result.current.schema).toEqual(schema));
    expect(executeStringFunctionMock).toHaveBeenCalledTimes(1);
  });

  it("keeps schema null when the onLoad result is not a warehouse process", async () => {
    executeStringFunctionMock.mockResolvedValue({ type: "other" });

    const { result } = renderPlugin(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(executeStringFunctionMock).toHaveBeenCalledTimes(1);
    expect(result.current.schema).toBeNull();
  });
});
