/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import {
  buildGridConfiguration,
  parseGridConfiguration,
  parseClassicGridConfiguration,
  rawRecordToSavedView,
} from "../transform";
import type { MRTViewConfig, RawSavedViewRecord } from "../types";

// ============================================================================
// Test 1: Persist Current View Configuration
// buildGridConfiguration correctly serializes MRT state
// ============================================================================
describe("buildGridConfiguration", () => {
  it("serializes filters, visibility, sorting, and order into JSON", () => {
    const filters = [{ id: "name", value: "Acme" }];
    const visibility = { name: true, status: false };
    const sorting = [{ id: "name", desc: false }];
    const order = ["name", "status", "date"];

    const result = buildGridConfiguration(filters, visibility, sorting, order);
    const parsed = JSON.parse(result) as MRTViewConfig;

    expect(parsed.version).toBe(1);
    expect(parsed.source).toBe("workspace-ui");
    expect(parsed.filters).toEqual(filters);
    expect(parsed.visibility).toEqual(visibility);
    expect(parsed.sorting).toEqual(sorting);
    expect(parsed.order).toEqual(order);
  });

  it("produces a valid JSON string", () => {
    const result = buildGridConfiguration([], {}, [], []);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("handles empty state — all fields present and empty", () => {
    const result = buildGridConfiguration([], {}, [], []);
    const parsed = JSON.parse(result) as MRTViewConfig;

    expect(parsed.version).toBe(1);
    expect(parsed.source).toBe("workspace-ui");
    expect(parsed.filters).toEqual([]);
    expect(parsed.visibility).toEqual({});
    expect(parsed.sorting).toEqual([]);
    expect(parsed.order).toEqual([]);
  });

  it("serializes multiple active filters correctly", () => {
    const filters = [
      { id: "status", value: "active" },
      { id: "amount", value: "100" },
    ];
    const result = buildGridConfiguration(filters, {}, [], []);
    const parsed = JSON.parse(result) as MRTViewConfig;

    expect(parsed.filters).toHaveLength(2);
    expect(parsed.filters[0]).toEqual({ id: "status", value: "active" });
    expect(parsed.filters[1]).toEqual({ id: "amount", value: "100" });
  });

  it("serializes descending sort correctly", () => {
    const sorting = [{ id: "date", desc: true }];
    const result = buildGridConfiguration([], {}, sorting, []);
    const parsed = JSON.parse(result) as MRTViewConfig;

    expect(parsed.sorting[0].desc).toBe(true);
  });
});

// ============================================================================
// Test 2: Load Saved Configuration
// parseGridConfiguration deserializes workspace-ui format
// ============================================================================
describe("parseGridConfiguration", () => {
  const makeConfig = (overrides?: Partial<MRTViewConfig>): string => {
    const config: MRTViewConfig = {
      version: 1,
      source: "workspace-ui",
      filters: [{ id: "name", value: "Test" }],
      visibility: { col1: true, col2: false },
      sorting: [{ id: "name", desc: false }],
      order: ["col1", "col2"],
      ...overrides,
    };
    return JSON.stringify(config);
  };

  it("parses a valid workspace-ui config and returns correct MRT state", () => {
    const raw = makeConfig();
    const result = parseGridConfiguration(raw);

    expect(result).not.toBeNull();
    expect(result?.version).toBe(1);
    expect(result?.source).toBe("workspace-ui");
    expect(result?.filters).toEqual([{ id: "name", value: "Test" }]);
    expect(result?.visibility).toEqual({ col1: true, col2: false });
    expect(result?.sorting).toEqual([{ id: "name", desc: false }]);
    expect(result?.order).toEqual(["col1", "col2"]);
  });

  it("returns null for an empty string", () => {
    expect(parseGridConfiguration("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(parseGridConfiguration("   ")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseGridConfiguration("{not valid json}")).toBeNull();
  });

  it("returns null for a Classic-format config (no version/source)", () => {
    const classicRaw = JSON.stringify({
      fields: [{ name: "col1", visible: true }],
      criteria: [{ fieldName: "status", operator: "equals", value: "active" }],
    });
    expect(parseGridConfiguration(classicRaw)).toBeNull();
  });

  it("returns null when source is not workspace-ui", () => {
    const raw = JSON.stringify({
      version: 1,
      source: "other-system",
      filters: [],
      visibility: {},
      sorting: [],
      order: [],
    });
    expect(parseGridConfiguration(raw)).toBeNull();
  });

  it("returns null when version is missing", () => {
    const raw = JSON.stringify({ source: "workspace-ui", filters: [], visibility: {}, sorting: [], order: [] });
    expect(parseGridConfiguration(raw)).toBeNull();
  });

  it("preserves the full filters array on round-trip", () => {
    const filters = [
      { id: "status", value: "active" },
      { id: "amount", value: "500" },
    ];
    const raw = makeConfig({ filters });
    const result = parseGridConfiguration(raw);

    expect(result?.filters).toEqual(filters);
  });
});

// ============================================================================
// Test 3: Legacy View Compatibility
// parseClassicGridConfiguration transforms Classic format
// ============================================================================
describe("parseClassicGridConfiguration", () => {
  it("returns fields array from a Classic config", () => {
    const raw = JSON.stringify({
      fields: [
        { name: "col1", visible: true },
        { name: "col2", visible: false },
      ],
      criteria: [{ fieldName: "status", operator: "equals", value: "active" }],
      sortBy: "col1",
    });

    const result = parseClassicGridConfiguration(raw);

    expect(result).not.toBeNull();
    expect(result?.fields).toHaveLength(2);
    expect(result?.fields?.[0]).toEqual({ name: "col1", visible: true });
    expect(result?.fields?.[1]).toEqual({ name: "col2", visible: false });
  });

  it("maps criteria fieldName and value from Classic config", () => {
    const raw = JSON.stringify({
      criteria: [{ fieldName: "documentNo", operator: "iContains", value: "INV-001" }],
    });

    const result = parseClassicGridConfiguration(raw);

    expect(result?.criteria).toHaveLength(1);
    expect(result?.criteria?.[0].fieldName).toBe("documentNo");
    expect(result?.criteria?.[0].value).toBe("INV-001");
  });

  it("maps sortBy string from Classic config", () => {
    const raw = JSON.stringify({
      sortBy: "businessPartner",
    });

    const result = parseClassicGridConfiguration(raw);

    expect(result?.sortBy).toBe("businessPartner");
  });

  it("maps fields order array from Classic config", () => {
    const raw = JSON.stringify({
      fields: [
        { name: "documentNo", visible: true },
        { name: "status", visible: true },
        { name: "date", visible: false },
      ],
    });

    const result = parseClassicGridConfiguration(raw);
    const names = result?.fields?.map((f) => f.name);

    expect(names).toEqual(["documentNo", "status", "date"]);
  });

  it("returns null for malformed JSON — graceful empty config", () => {
    expect(parseClassicGridConfiguration("{not json")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseClassicGridConfiguration("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(parseClassicGridConfiguration("   ")).toBeNull();
  });

  it("does not crash when fields array is missing", () => {
    const raw = JSON.stringify({ criteria: [], sortBy: "name" });
    const result = parseClassicGridConfiguration(raw);

    expect(result).not.toBeNull();
    expect(result?.fields).toBeUndefined();
  });

  it("does not crash when criteria array is missing", () => {
    const raw = JSON.stringify({ fields: [{ name: "col", visible: true }] });
    const result = parseClassicGridConfiguration(raw);

    expect(result).not.toBeNull();
    expect(result?.criteria).toBeUndefined();
  });

  it("returns null for a workspace-ui format (should not be parsed as Classic)", () => {
    const raw = JSON.stringify({
      version: 1,
      source: "workspace-ui",
      filters: [],
      visibility: {},
      sorting: [],
      order: [],
    });

    expect(parseClassicGridConfiguration(raw)).toBeNull();
  });

  it("does not return null for an empty array (treated as object — source behavior)", () => {
    // Arrays pass typeof === "object". The source guard only excludes non-objects and falsy values.
    // An empty array is cast to ClassicViewConfig with all optional fields absent.
    const result = parseClassicGridConfiguration("[]");
    // The result is not null — it is an empty ClassicViewConfig with no fields/criteria/sortBy
    expect(result).not.toBeNull();
    expect(result?.fields).toBeUndefined();
    expect(result?.criteria).toBeUndefined();
    expect(result?.sortBy).toBeUndefined();
  });

  it("returns null for a non-object JSON value (plain string)", () => {
    expect(parseClassicGridConfiguration('"just a string"')).toBeNull();
  });
});

// ============================================================================
// rawRecordToSavedView — shape normalization
// ============================================================================
describe("rawRecordToSavedView", () => {
  it("maps all raw fields to a normalized SavedView", () => {
    const raw: RawSavedViewRecord = {
      id: "view-1",
      tab: "tab-abc",
      name: "My View",
      isdefault: true,
      filterclause: "status='A'",
      gridconfiguration: '{"version":1,"source":"workspace-ui","filters":[],"visibility":{},"sorting":[],"order":[]}',
    };

    const result = rawRecordToSavedView(raw);

    expect(result.id).toBe("view-1");
    expect(result.tabId).toBe("tab-abc");
    expect(result.name).toBe("My View");
    expect(result.isDefault).toBe(true);
    expect(result.filterClause).toBe("status='A'");
    expect(result.gridConfiguration).toContain("workspace-ui");
  });

  it("uses safe defaults when optional fields are missing", () => {
    const raw: RawSavedViewRecord = { id: "view-2" };
    const result = rawRecordToSavedView(raw);

    expect(result.id).toBe("view-2");
    expect(result.name).toBe("");
    expect(result.tabId).toBe("");
    expect(result.isDefault).toBe(false);
    expect(result.filterClause).toBe("");
    expect(result.gridConfiguration).toBe("");
  });
});
