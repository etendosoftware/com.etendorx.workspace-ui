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

import { buildHelpSections, shouldShowHelp } from "../buildHelpContent";
import { createMockWindowMetadata, createMockTab, createMockField } from "@/utils/tests/mockHelpers";

describe("shouldShowHelp", () => {
  it("returns true for non-empty window-level helpComment", () => {
    const window = { ...createMockWindowMetadata("W1"), helpComment: "Some help", tabs: [] };
    expect(shouldShowHelp(window)).toBe(true);
  });

  it("returns false when window, tab, and field helpComment are all blank", () => {
    const tab = createMockTab({ id: "t1", helpComment: null, fields: {} });
    for (const helpComment of [null, undefined, "", "   "] as const) {
      const window = { ...createMockWindowMetadata("W1"), helpComment, tabs: [tab] };
      expect(shouldShowHelp(window)).toBe(false);
    }
  });

  it("returns true when window-level help is blank but a tab has help text (e.g. Toolbar)", () => {
    const tab = createMockTab({ id: "t1", helpComment: "Tab-level help", fields: {} });
    const window = { ...createMockWindowMetadata("W1"), helpComment: null, tabs: [tab] };
    expect(shouldShowHelp(window)).toBe(true);
  });

  it("returns true when window- and tab-level help are blank but a field has help text (e.g. Toolbar)", () => {
    const field = createMockField({ id: "f1", helpComment: "Field-level help" });
    const tab = createMockTab({ id: "t1", helpComment: null, fields: { f1: field } });
    const window = { ...createMockWindowMetadata("W1"), helpComment: null, tabs: [tab] };
    expect(shouldShowHelp(window)).toBe(true);
  });

  it("returns false for a null/undefined window", () => {
    expect(shouldShowHelp(null)).toBe(false);
    expect(shouldShowHelp(undefined)).toBe(false);
  });
});

describe("buildHelpSections", () => {
  it("orders tabs by sequenceNumber regardless of array order", () => {
    const tabA = createMockTab({ id: "a", name: "Lines", sequenceNumber: 20, fields: {} });
    const tabB = createMockTab({ id: "b", name: "Header", sequenceNumber: 10, fields: {} });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tabA, tabB] };

    const sections = buildHelpSections(window);

    expect(sections.map((s) => s.id)).toEqual(["b", "a"]);
  });

  it("orders fields within a tab by sequenceNumber", () => {
    const field20 = createMockField({ id: "f20", name: "Second", sequenceNumber: 20, helpComment: "help" });
    const field10 = createMockField({ id: "f10", name: "First", sequenceNumber: 10, helpComment: "help" });
    const tab = createMockTab({ id: "t1", sequenceNumber: 10, fields: { field20, field10 } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields.map((f) => f.id)).toEqual(["f10", "f20"]);
  });

  it("omits fields with no helpComment and no column fallback", () => {
    const withHelp = createMockField({ id: "f1", helpComment: "has help", column: { helpComment: undefined } });
    const withoutHelp = createMockField({ id: "f2", helpComment: "", column: { helpComment: undefined } });
    const tab = createMockTab({ id: "t1", fields: { withHelp, withoutHelp } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields.map((f) => f.id)).toEqual(["f1"]);
  });

  it("falls back to column.helpComment when field.helpComment is empty", () => {
    const field = createMockField({ id: "f1", helpComment: "", column: { helpComment: "column help text" } });
    const tab = createMockTab({ id: "t1", fields: { field } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields).toEqual([{ id: "f1", name: field.name, helpComment: "column help text" }]);
  });

  it("omits fields whose helpComment is undefined (not just empty) with no column fallback", () => {
    const field = createMockField({ id: "f1", helpComment: undefined as unknown as string, column: undefined });
    const tab = createMockTab({ id: "t1", fields: { field } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields).toEqual([]);
  });

  it("omits audit synthetic fields regardless of help content", () => {
    const auditField = createMockField({ id: "f1", helpComment: "audit help", isAuditField: true });
    const tab = createMockTab({ id: "t1", fields: { auditField } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields).toEqual([]);
  });

  it("returns empty-string tab helpComment (not null/undefined) when tab has none", () => {
    const tab = createMockTab({ id: "t1", helpComment: null, fields: {} });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].helpComment).toBe("");
  });

  it("omits inactive tabs, matching Classic's Help view", () => {
    const activeTab = createMockTab({ id: "active", name: "Header", sequenceNumber: 10, active: true, fields: {} });
    const inactiveTab = createMockTab({
      id: "inactive",
      name: "Discounts and Promotions",
      sequenceNumber: 20,
      active: false,
      fields: {},
    });
    const window = { ...createMockWindowMetadata("W1"), tabs: [activeTab, inactiveTab] };

    const sections = buildHelpSections(window);

    expect(sections.map((s) => s.id)).toEqual(["active"]);
  });

  it("omits inactive fields regardless of help content", () => {
    const inactiveField = createMockField({ id: "f1", helpComment: "help", active: false });
    const tab = createMockTab({ id: "t1", fields: { inactiveField } });
    const window = { ...createMockWindowMetadata("W1"), tabs: [tab] };

    const sections = buildHelpSections(window);

    expect(sections[0].fields).toEqual([]);
  });
});
