import { shouldShowTab, type TabWithParentInfo } from "../tabUtils";

const makeTab = (overrides: Partial<TabWithParentInfo> = {}): TabWithParentInfo => ({
  id: "tab1",
  name: "Tab 1",
  tabLevel: 0,
  entityName: "SomeEntity",
  ...overrides,
});

const makeParentTab = (overrides: Partial<TabWithParentInfo> = {}): TabWithParentInfo => ({
  id: "parent1",
  name: "Parent Tab",
  tabLevel: 0,
  entityName: "ParentEntity",
  ...overrides,
});

describe("shouldShowTab", () => {
  describe("level 0 tabs", () => {
    it("always shows tabLevel 0 tabs regardless of activeParentTab", () => {
      const tab = makeTab({ tabLevel: 0 });
      expect(shouldShowTab(tab, null)).toBe(true);
      expect(shouldShowTab(tab, makeParentTab())).toBe(true);
    });
  });

  describe("tabs with no activeParentTab", () => {
    it("hides non-root tabs when there is no active parent tab", () => {
      const tab = makeTab({ tabLevel: 1 });
      expect(shouldShowTab(tab, null)).toBe(false);
    });
  });

  describe("inactive tabs", () => {
    it("hides tabs with active === false", () => {
      const tab = makeTab({ tabLevel: 1, active: false });
      const parent = makeParentTab({ id: "parent1" });
      expect(shouldShowTab(tab, parent)).toBe(false);
    });
  });

  describe("matching via parentTabId", () => {
    it("shows a tab whose parentTabId matches the active parent tab id", () => {
      const parent = makeParentTab({ id: "parent1" });
      const tab = makeTab({ tabLevel: 1, parentTabId: "parent1" });
      expect(shouldShowTab(tab, parent)).toBe(true);
    });

    it("hides a tab whose parentTabId does not match the active parent tab id", () => {
      const parent = makeParentTab({ id: "parent1" });
      const tab = makeTab({ tabLevel: 1, parentTabId: "other-parent" });
      expect(shouldShowTab(tab, parent)).toBe(false);
    });
  });

  describe("matching via parentColumns - name match", () => {
    it("shows tab when parentColumn matches parent entityName", () => {
      const parent = makeParentTab({ id: "parent1", entityName: "SalesOrder" });
      const tab = makeTab({
        tabLevel: 1,
        parentColumns: ["salesOrder_ID"],
      });
      expect(shouldShowTab(tab, parent)).toBe(true);
    });

    it("shows tab when parentColumn matches parent table identifier", () => {
      const parent = makeParentTab({ id: "parent1", entityName: "Other", table$_identifier: "SalesOrder" });
      const tab = makeTab({
        tabLevel: 1,
        parentColumns: ["salesorder"],
      });
      expect(shouldShowTab(tab, parent)).toBe(true);
    });

    it("hides tab when parentColumns exist but none match", () => {
      const parent = makeParentTab({
        id: "parent1",
        entityName: "UnrelatedEntity",
        table$_identifier: "UnrelatedTable",
      });
      const tab = makeTab({
        tabLevel: 1,
        parentColumns: ["XYZ_completely_different"],
      });
      expect(shouldShowTab(tab, parent)).toBe(false);
    });
  });

  describe("matching via parentColumns - field metadata", () => {
    it("shows tab when field's referencedEntity matches parent entityName", () => {
      const parent = makeParentTab({ id: "parent1", entityName: "TargetEntity" });
      const tab = makeTab({
        tabLevel: 1,
        parentColumns: ["some_field"],
        fields: {
          some_field: {
            referencedEntity: "TargetEntity",
          } as any,
        },
      });
      expect(shouldShowTab(tab, parent)).toBe(true);
    });

    it("shows tab when field's columnName matches parent entityName", () => {
      const parent = makeParentTab({ id: "parent1", entityName: "targetentity" });
      const tab = makeTab({
        tabLevel: 1,
        parentColumns: ["someField"],
        fields: {
          someField: {
            columnName: "targetentity_id",
          } as any,
        },
      });
      expect(shouldShowTab(tab, parent)).toBe(true);
    });
  });

  describe("tabs with no parentColumns and no parentTabId", () => {
    it("hides child tab with no matching criteria", () => {
      const parent = makeParentTab({ id: "parent1" });
      const tab = makeTab({ tabLevel: 1 });
      expect(shouldShowTab(tab, parent)).toBe(false);
    });
  });

  describe("empty parentColumns array", () => {
    it("hides tab with empty parentColumns and no parentTabId", () => {
      const parent = makeParentTab({ id: "parent1" });
      const tab = makeTab({ tabLevel: 1, parentColumns: [] });
      expect(shouldShowTab(tab, parent)).toBe(false);
    });
  });
});
