import { shouldShowTab, type TabWithParentInfo } from "../utils/tabUtils";
import type { Tab } from "@workspaceui/api-client/src/api/types";

const createMockTab = (overrides: Partial<Tab> = {}): Tab => ({
  id: "default-id",
  tabLevel: 0,
  name: "Default Tab",
  _identifier: "default-identifier",
  entityName: "DefaultEntity",
  table$_identifier: "default_table",
  uIPattern: "",
  window: "",
  title: "Default Title",
  parentColumns: [],
  table: "",
  readOnlyLogic: "",
  displayLogic: "",
  orderByClause: "",
  whereClause: "",
  ...overrides
});

const createMockTabWithParentInfo = (overrides: Partial<TabWithParentInfo> = {}): TabWithParentInfo => ({
  ...createMockTab(),
  ...overrides
});

describe("tabUtils", () => {
  describe("shouldShowTab", () => {
    it("should return true for tabs with level 0", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab1",
        tabLevel: 0,
        name: "Root Tab",
        _identifier: "tab1",
        entityName: "Entity",
        table$_identifier: "table1"
      });

      const result = shouldShowTab(tab, null);

      expect(result).toBe(true);
    });

    it("should return false when no active parent tab and level > 0", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab2",
        tabLevel: 1,
        name: "Child Tab",
        _identifier: "tab2",
        entityName: "Entity",
        table$_identifier: "table2"
      });

      const result = shouldShowTab(tab, null);

      expect(result).toBe(false);
    });

    it("should return false when tab is inactive", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab3",
        tabLevel: 1,
        name: "Inactive Tab",
        _identifier: "tab3",
        entityName: "Entity",
        table$_identifier: "table3",
        active: false
      });

      const activeParentTab = createMockTab({
        id: "parent1",
        tabLevel: 0,
        name: "Parent Tab",
        _identifier: "parent1",
        entityName: "ParentEntity",
        table$_identifier: "parent_table"
      });

      const result = shouldShowTab(tab, activeParentTab);

      expect(result).toBe(false);
    });

    it("should return true when parentTabId matches active parent tab id", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab4",
        tabLevel: 1,
        name: "Child Tab",
        _identifier: "tab4",
        entityName: "Entity",
        table$_identifier: "table4",
        parentTabId: "parent1"
      });

      const activeParentTab = createMockTab({
        id: "parent1",
        tabLevel: 0,
        name: "Parent Tab",
        _identifier: "parent1",
        entityName: "ParentEntity",
        table$_identifier: "parent_table"
      });

      const result = shouldShowTab(tab, activeParentTab);

      expect(result).toBe(true);
    });

    it("should return false when parentTabId does not match active parent tab id", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab5",
        tabLevel: 1,
        name: "Child Tab",
        _identifier: "tab5",
        entityName: "Entity",
        table$_identifier: "table5",
        parentTabId: "different_parent"
      });

      const activeParentTab = createMockTab({
        id: "parent1",
        tabLevel: 0,
        name: "Parent Tab",
        _identifier: "parent1",
        entityName: "ParentEntity",
        table$_identifier: "parent_table"
      });

      const result = shouldShowTab(tab, activeParentTab);

      expect(result).toBe(false);
    });

    it("should return true when parentColumns match with entity name", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab6",
        tabLevel: 1,
        name: "Child Tab",
        _identifier: "tab6",
        entityName: "Entity",
        table$_identifier: "table6",
        parentColumns: ["business_partner_id"]
      });

      const activeParentTab = createMockTab({
        id: "parent1",
        tabLevel: 0,
        name: "Parent Tab",
        _identifier: "parent1",
        entityName: "BusinessPartner",
        table$_identifier: "c_bpartner"
      });

      const result = shouldShowTab(tab, activeParentTab);

      expect(result).toBe(true);
    });

    it("should return true when parentColumns match with table identifier", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab7",
        tabLevel: 1,
        name: "Child Tab",
        _identifier: "tab7",
        entityName: "Entity",
        table$_identifier: "table7",
        parentColumns: ["product_id"]
      });

      const activeParentTab = createMockTab({
        id: "parent1",
        tabLevel: 0,
        name: "Parent Tab",
        _identifier: "parent1",
        entityName: "SomeEntity",
        table$_identifier: "m_product"
      });

      const result = shouldShowTab(tab, activeParentTab);

      expect(result).toBe(true);
    });

    it("should return false when parentColumns do not match", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab8",
        tabLevel: 1,
        name: "Child Tab",
        _identifier: "tab8",
        entityName: "Entity",
        table$_identifier: "table8",
        parentColumns: ["unrelated_column_id"]
      });

      const activeParentTab = createMockTab({
        id: "parent1",
        tabLevel: 0,
        name: "Parent Tab",
        _identifier: "parent1",
        entityName: "BusinessPartner",
        table$_identifier: "c_bpartner"
      });

      const result = shouldShowTab(tab, activeParentTab);

      expect(result).toBe(false);
    });

    it("should handle financial prefixes normalization", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab9",
        tabLevel: 1,
        name: "Child Tab",
        _identifier: "tab9",
        entityName: "Entity",
        table$_identifier: "table9",
        parentColumns: ["invoice_id"]
      });

      const activeParentTab = createMockTab({
        id: "parent1",
        tabLevel: 0,
        name: "Parent Tab",
        _identifier: "parent1",
        entityName: "FinInvoice",
        table$_identifier: "c_invoice"
      });

      const result = shouldShowTab(tab, activeParentTab);

      expect(result).toBe(true);
    });

    it("should return false when no parentColumns and no parentTabId", () => {
      const tab = createMockTabWithParentInfo({
        id: "tab10",
        tabLevel: 1,
        name: "Child Tab",
        _identifier: "tab10",
        entityName: "Entity",
        table$_identifier: "table10"
      });

      const activeParentTab = createMockTab({
        id: "parent1",
        tabLevel: 0,
        name: "Parent Tab",
        _identifier: "parent1",
        entityName: "ParentEntity",
        table$_identifier: "parent_table"
      });

      const result = shouldShowTab(tab, activeParentTab);

      expect(result).toBe(false);
    });
  });
});