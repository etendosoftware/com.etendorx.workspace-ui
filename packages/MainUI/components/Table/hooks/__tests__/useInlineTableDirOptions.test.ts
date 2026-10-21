import { act, renderHook } from "@testing-library/react";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { logger } from "@/utils/logger";
import { useInlineTableDirOptions } from "../useInlineTableDirOptions";

jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { client: { request: jest.fn() } },
}));

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn(), debug: jest.fn(), info: jest.fn() },
}));

const request = datasource.client.request as jest.Mock;

const field = (overrides: Partial<Field> = {}): Field =>
  ({ name: "Organization", hqlName: "organization", referencedEntity: "Organization", ...overrides }) as Field;

const sentBody = (call = 0) => Object.fromEntries(request.mock.calls[call][1].body as URLSearchParams);

const respond = (data: Record<string, unknown>[]) => request.mockResolvedValue({ data: { response: { data } } });

describe("useInlineTableDirOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns no options for a field without a datasource", async () => {
    const { result } = renderHook(() => useInlineTableDirOptions());

    const options = await result.current.loadOptions(field({ referencedEntity: undefined }));

    expect(options).toEqual([]);
    expect(request).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("sends the window, tab, organization, row context and search, and maps records to options", async () => {
    respond([{ id: "1", _identifier: "Spain" }]);
    const tab = { fields: { businessPartner: { inputName: "inpcBpartnerId" } } } as unknown as Tab;
    const { result } = renderHook(() => useInlineTableDirOptions({ tabId: "T1", windowId: "W1", tab }));

    let options: Awaited<ReturnType<typeof result.current.loadOptions>> = [];
    await act(async () => {
      options = await result.current.loadOptions(
        field(),
        "Spa",
        { organization: "ORG", businessPartner: "BP", dateFrom: "2026-10-21", _skipped: "x", id: "row" },
        10
      );
    });

    expect(request.mock.calls[0][0]).toBe("/api/datasource/Organization");
    expect(sentBody()).toMatchObject({
      _endRow: "10",
      tabId: "T1",
      inpTabId: "T1",
      windowId: "W1",
      inpwindowId: "W1",
      _org: "ORG",
      inpadOrgId: "ORG",
      inpcBpartnerId: "BP",
      dateFrom: "21-10-2026",
      _identifier: "Spa",
      name: "Spa",
    });
    expect(sentBody()).not.toHaveProperty("_skipped");
    expect(options).toEqual([expect.objectContaining({ id: "1", value: "1", label: "Spain" })]);
  });

  it("uses the selector's display and nested value fields", async () => {
    respond([{ id: "compound", product: { id: "P1" }, searchKey: "SK" }]);
    const { result } = renderHook(() => useInlineTableDirOptions());

    const options = await result.current.loadOptions(
      field({ selector: { valueField: "product$id", displayField: "searchKey" } } as Partial<Field>),
      "x"
    );

    expect(options[0]).toMatchObject({ value: "P1", label: "SK" });
  });

  it("adds the combo table and selector parameters of special datasources", async () => {
    respond([]);
    const { result } = renderHook(() => useInlineTableDirOptions());

    await result.current.loadOptions(
      field({
        selector: { datasourceName: "ComboTableDatasourceService", fieldId: "F1", _selectorDefinitionId: "S1" },
      } as Partial<Field>),
      "x"
    );

    expect(request.mock.calls[0][0]).toBe("/api/datasource/ComboTableDatasourceService");
    expect(sentBody()).toMatchObject({ fieldId: "F1", moduleId: "0", _selectorDefinitionId: "S1" });
  });

  it("sends the row context as is when there is no tab metadata", async () => {
    respond([]);
    const { result } = renderHook(() => useInlineTableDirOptions());

    await result.current.loadOptions(field(), "x", { businessPartner: "BP", active: true });

    expect(sentBody()).toMatchObject({ businessPartner: "BP" });
  });

  it("caches options per request: other row values are fetched again", async () => {
    respond([{ id: "1", _identifier: "A" }]);
    const { result } = renderHook(() => useInlineTableDirOptions());

    await act(async () => {
      await result.current.loadOptions(field(), undefined, { businessPartner: "BP1" });
    });
    await act(async () => {
      await result.current.loadOptions(field(), undefined, { businessPartner: "BP1" });
    });
    expect(request).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.loadOptions(field(), undefined, { businessPartner: "BP2" });
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("refetches after the cache of a field or all fields is cleared", async () => {
    respond([]);
    const { result } = renderHook(() => useInlineTableDirOptions());

    await act(async () => {
      await result.current.loadOptions(field());
    });
    act(() => result.current.clearCache("Organization"));
    await act(async () => {
      await result.current.loadOptions(field());
    });
    act(() => result.current.clearCache());
    await act(async () => {
      await result.current.loadOptions(field());
    });

    expect(request).toHaveBeenCalledTimes(3);
  });

  it("logs a server error and still returns the records", async () => {
    request.mockResolvedValue({ data: { response: { error: { message: "boom" }, data: [{ id: "1" }] } } });
    const { result } = renderHook(() => useInlineTableDirOptions());

    const options = await result.current.loadOptions(field(), "x");

    expect(logger.error).toHaveBeenCalled();
    expect(options).toHaveLength(1);
  });

  it("returns no options when the request fails and clears the loading state", async () => {
    request.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useInlineTableDirOptions());

    let options: unknown[] = ["unset"];
    await act(async () => {
      options = await result.current.loadOptions(field(), "x");
    });

    expect(options).toEqual([]);
    expect(result.current.isLoading("Organization")).toBe(false);
  });
});
