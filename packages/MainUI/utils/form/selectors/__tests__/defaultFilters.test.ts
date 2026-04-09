/**
 * Tests for utils/form/selectors/defaultFilters.ts
 * Covers fetchSelectorDefaultFilters and buildCriteriaFromDefaults
 */

import { buildCriteriaFromDefaults, fetchSelectorDefaultFilters } from "../defaultFilters";
import type { DefaultFilterResponse } from "../defaultFilters";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    client: {
      request: jest.fn(),
    },
  },
}));

import { Metadata } from "@workspaceui/api-client/src/api/metadata";

const mockRequest = Metadata.client.request as jest.Mock;

describe("fetchSelectorDefaultFilters", () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  it("calls request with the correct URL containing action handler", async () => {
    mockRequest.mockResolvedValueOnce({ data: {} });
    await fetchSelectorDefaultFilters("sel-def-1", {});
    expect(mockRequest).toHaveBeenCalledWith(
      expect.stringContaining("SelectorDefaultFilterActionHandler"),
      expect.any(Object)
    );
  });

  it("includes _selectorDefinitionId in the request body", async () => {
    mockRequest.mockResolvedValueOnce({ data: {} });
    await fetchSelectorDefaultFilters("sel-def-1", {});
    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.objectContaining({ _selectorDefinitionId: "sel-def-1" }),
      })
    );
  });

  it("merges context into the request body", async () => {
    mockRequest.mockResolvedValueOnce({ data: {} });
    await fetchSelectorDefaultFilters("sel-def-1", { inpTabId: "tab-1", inpwindowId: "win-1" });
    expect(mockRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.objectContaining({ inpTabId: "tab-1", inpwindowId: "win-1" }),
      })
    );
  });

  it("returns response.data on success", async () => {
    mockRequest.mockResolvedValueOnce({ data: { fieldA: "valueA" } });
    const result = await fetchSelectorDefaultFilters("sel-def-1", {});
    expect(result).toEqual({ fieldA: "valueA" });
  });

  it("returns empty object when response is null", async () => {
    mockRequest.mockResolvedValueOnce(null);
    const result = await fetchSelectorDefaultFilters("sel-def-1", {});
    expect(result).toEqual({});
  });

  it("returns empty object when response.data is undefined", async () => {
    mockRequest.mockResolvedValueOnce({ data: undefined });
    const result = await fetchSelectorDefaultFilters("sel-def-1", {});
    expect(result).toEqual({});
  });

  it("uses POST method", async () => {
    mockRequest.mockResolvedValueOnce({ data: {} });
    await fetchSelectorDefaultFilters("sel-def-1", {});
    expect(mockRequest).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: "POST" }));
  });
});

describe("buildCriteriaFromDefaults", () => {
  it("skips the idFilters key from direct criteria processing", () => {
    const defaults: DefaultFilterResponse = {
      idFilters: [{ fieldName: "warehouse", id: "wh-1", _identifier: "Warehouse 1" }],
    };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const idFiltersCriteria = criteria.find((c) => c.fieldName === "idFilters");
    expect(idFiltersCriteria).toBeUndefined();
  });

  it("skips null values", () => {
    const defaults = { fieldA: null } as unknown as DefaultFilterResponse;
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const fieldACriteria = criteria.find((c) => c.fieldName === "fieldA");
    expect(fieldACriteria).toBeUndefined();
  });

  it("skips undefined values", () => {
    const defaults = { fieldA: undefined } as DefaultFilterResponse;
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const fieldACriteria = criteria.find((c) => c.fieldName === "fieldA");
    expect(fieldACriteria).toBeUndefined();
  });

  it("skips empty string values", () => {
    const defaults: DefaultFilterResponse = { fieldA: "" };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const fieldACriteria = criteria.find((c) => c.fieldName === "fieldA");
    expect(fieldACriteria).toBeUndefined();
  });

  it("uses iContains operator for filterExpression field", () => {
    const defaults: DefaultFilterResponse = { filterExpression: "search text" };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const filterExprCriteria = criteria.find((c) => c.fieldName === "filterExpression");
    expect(filterExprCriteria).toBeDefined();
    expect(filterExprCriteria?.operator).toBe("iContains");
    expect(filterExprCriteria?.value).toBe("search text");
  });

  it("converts 'true' string to boolean true", () => {
    const defaults: DefaultFilterResponse = { active: "true" };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const activeCriteria = criteria.find((c) => c.fieldName === "active");
    expect(activeCriteria?.value).toBe(true);
    expect(activeCriteria?.operator).toBe("equals");
  });

  it("converts 'false' string to boolean false", () => {
    const defaults: DefaultFilterResponse = { active: "false" };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const activeCriteria = criteria.find((c) => c.fieldName === "active");
    expect(activeCriteria?.value).toBe(false);
    expect(activeCriteria?.operator).toBe("equals");
  });

  it("keeps other string values with equals operator", () => {
    const defaults: DefaultFilterResponse = { status: "active" };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const statusCriteria = criteria.find((c) => c.fieldName === "status");
    expect(statusCriteria?.operator).toBe("equals");
    expect(statusCriteria?.value).toBe("active");
  });

  it("converts idFilters entries to equals criteria using their id", () => {
    const defaults: DefaultFilterResponse = {
      idFilters: [
        { fieldName: "warehouse", id: "wh-1", _identifier: "Warehouse 1" },
        { fieldName: "org", id: "org-2", _identifier: "Organization 2" },
      ],
    };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    const warehouseCriteria = criteria.find((c) => c.fieldName === "warehouse");
    expect(warehouseCriteria?.operator).toBe("equals");
    expect(warehouseCriteria?.value).toBe("wh-1");
    const orgCriteria = criteria.find((c) => c.fieldName === "org");
    expect(orgCriteria?.value).toBe("org-2");
  });

  it("always appends _selectorDefinitionId criteria with iContains", () => {
    const defaults: DefaultFilterResponse = {};
    const criteria = buildCriteriaFromDefaults(defaults, "my-selector-id");
    const selectorCriteria = criteria.find((c) => c.fieldName === "_selectorDefinitionId");
    expect(selectorCriteria).toBeDefined();
    expect(selectorCriteria?.operator).toBe("iContains");
    expect(selectorCriteria?.value).toBe("my-selector-id");
  });

  it("produces only the _selectorDefinitionId entry for empty defaults", () => {
    const defaults: DefaultFilterResponse = {};
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    expect(criteria).toHaveLength(1);
    expect(criteria[0].fieldName).toBe("_selectorDefinitionId");
  });

  it("appends _selectorDefinitionId as the last entry", () => {
    const defaults: DefaultFilterResponse = { active: "true" };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-def-1");
    expect(criteria[criteria.length - 1].fieldName).toBe("_selectorDefinitionId");
  });

  it("processes a combination of regular fields, idFilters and filterExpression", () => {
    const defaults: DefaultFilterResponse = {
      filterExpression: "search",
      active: "true",
      status: "open",
      idFilters: [{ fieldName: "warehouse", id: "wh-1", _identifier: "WH" }],
    };
    const criteria = buildCriteriaFromDefaults(defaults, "sel-id");
    // filterExpression, active, status, warehouse (idFilter), _selectorDefinitionId
    expect(criteria.length).toBeGreaterThanOrEqual(5);
    expect(criteria[criteria.length - 1].fieldName).toBe("_selectorDefinitionId");
  });
});
