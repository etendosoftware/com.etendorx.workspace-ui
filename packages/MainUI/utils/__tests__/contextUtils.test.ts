import {
  buildAncestorContext,
  buildContextString,
  buildEtendoContext,
  buildParentSessionContext,
  buildRecordContext,
} from "../contextUtils";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import type Graph from "../../data/graph";

// Mock the CONTEXT_CONSTANTS
jest.mock("@workspaceui/api-client/src/api/copilot", () => ({
  CONTEXT_CONSTANTS: {
    TAG_START: "<CONTEXT>",
    TAG_END: "</CONTEXT>",
  },
}));

const RECORDS_TEXT = "records";

describe("contextUtils", () => {
  describe("buildContextString", () => {
    it("should return empty string when no context items", () => {
      const result = buildContextString({
        contextItems: [],
        registersText: RECORDS_TEXT,
      });

      expect(result).toBe("");
    });

    it("should build context string with single item", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Item 1" }],
        registersText: RECORDS_TEXT,
      });

      expect(result).toContain("<CONTEXT>");
      expect(result).toContain("</CONTEXT>");
      expect(result).toContain("1 records");
      expect(result).toContain("Item 1");
    });

    it("should build context string with multiple items separated by separator", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Item 1" }, { contextString: "Item 2" }, { contextString: "Item 3" }],
        registersText: RECORDS_TEXT,
      });

      expect(result).toContain("3 records");
      expect(result).toContain("Item 1");
      expect(result).toContain("Item 2");
      expect(result).toContain("Item 3");
      expect(result).toContain("---"); // separator
    });

    it("should use custom registers text", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Data" }],
        registersText: "items",
      });

      expect(result).toContain("1 items");
    });

    it("should format output with correct structure", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Test" }],
        registersText: RECORDS_TEXT,
      });

      expect(result).toMatch(/<CONTEXT> \(1 records\):\n\nTest<\/CONTEXT>/);
    });

    it("should join multiple items with separator", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "A" }, { contextString: "B" }],
        registersText: RECORDS_TEXT,
      });

      expect(result).toContain("A\n\n---\n\nB");
    });

    it("should handle context items with complex strings", () => {
      const result = buildContextString({
        contextItems: [{ contextString: "Name: John\nAge: 30" }, { contextString: "Name: Jane\nAge: 25" }],
        registersText: "users",
      });

      expect(result).toContain("2 users");
      expect(result).toContain("Name: John");
      expect(result).toContain("Name: Jane");
    });
  });

  describe("buildEtendoContext", () => {
    // Mock Graph
    const mockGraph = {
      getParent: jest.fn(),
      getSelected: jest.fn(),
    } as unknown as Graph<Tab>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return empty object if no record selected and no parent", () => {
      const tab = { id: "tab1", fields: {} } as Tab;
      (mockGraph.getParent as jest.Mock).mockReturnValue(undefined);
      (mockGraph.getSelected as jest.Mock).mockReturnValue(undefined);

      const result = buildEtendoContext(tab, mockGraph);
      expect(result).toEqual({});
    });

    it("should include ID and storedInSession fields for selected record", () => {
      const tab = {
        id: "tab1",
        entityName: "Entity1",
        fields: {
          field1: { hqlName: "id", column: { storedInSession: "false" } },
          field2: { hqlName: "name", column: { storedInSession: "true" } },
          field3: { hqlName: "other", column: { storedInSession: undefined } },
        },
      } as unknown as Tab;

      const record = {
        id: "record1",
        name: "Test Name",
        other: "Ignored",
      };

      (mockGraph.getParent as jest.Mock).mockReturnValue(undefined);
      (mockGraph.getSelected as jest.Mock).mockReturnValue(record);

      const result = buildEtendoContext(tab, mockGraph);

      expect(result).toEqual({
        "@Entity1.id@": "record1",
        "@Entity1.name@": "Test Name",
      });
      expect(result).not.toHaveProperty("@Entity1.other@");
    });

    it("should recursively gather context from parent tabs", () => {
      // Parent Tab
      const parentTab = {
        id: "parentTab",
        entityName: "ParentEntity",
        fields: {
          field1: { hqlName: "id", column: { storedInSession: "false" } },
        },
      } as unknown as Tab;

      // Child Tab
      const childTab = {
        id: "childTab",
        entityName: "ChildEntity",
        fields: {
          field1: { hqlName: "id", column: { storedInSession: "false" } },
        },
      } as unknown as Tab;

      const parentRecord = { id: "parentRecord1" };
      const childRecord = { id: "childRecord1" };

      // Setup Graph mocks
      (mockGraph.getParent as jest.Mock).mockImplementation((t) => {
        if (t.id === "childTab") return parentTab;
        return undefined;
      });

      (mockGraph.getSelected as jest.Mock).mockImplementation((t) => {
        if (t.id === "childTab") return childRecord;
        if (t.id === "parentTab") return parentRecord;
        return undefined;
      });

      const result = buildEtendoContext(childTab, mockGraph);

      expect(result).toEqual({
        "@ParentEntity.id@": "parentRecord1",
        "@ChildEntity.id@": "childRecord1",
      });
    });

    it("should handle missing values gracefully", () => {
      const tab = {
        id: "tab1",
        entityName: "Entity1",
        fields: {
          field1: { hqlName: "name", column: { storedInSession: "true" } },
        },
      } as unknown as Tab;

      const record = {}; // name is undefined

      (mockGraph.getParent as jest.Mock).mockReturnValue(undefined);
      (mockGraph.getSelected as jest.Mock).mockReturnValue(record);

      const result = buildEtendoContext(tab, mockGraph);
      expect(result).toEqual({});
    });
  });

  describe("buildAncestorContext / buildRecordContext", () => {
    const ID_FIELD = { id: { hqlName: "id", column: {} } };
    /** A tab whose context is its record id, `@<entity>.id@`. */
    const idTab = (id: string, entityName: string) => ({ id, entityName, fields: ID_FIELD }) as unknown as Tab;
    const GRANDPARENT = idTab("grandparent", "Grandparent");
    const PARENT = idTab("parent", "Parent");
    const CHILD = idTab("child", "Child");
    const PARENTS: Record<string, Tab | undefined> = { child: PARENT, parent: GRANDPARENT };
    const SELECTED: Record<string, { id: string }> = {
      grandparent: { id: "g1" },
      parent: { id: "p1" },
      child: { id: "c1" },
    };

    const graphWith = (selected: Record<string, { id: string } | undefined>) =>
      ({
        getParent: (tab: Tab) => PARENTS[tab.id],
        getSelected: (tab: Tab) => selected[tab.id],
      }) as unknown as Graph<Tab>;

    it("gives the context of every ancestor without the record of the tab itself", () => {
      expect(buildAncestorContext(CHILD, graphWith(SELECTED))).toEqual({
        "@Grandparent.id@": "g1",
        "@Parent.id@": "p1",
      });
    });

    it("uses the given parent record for the direct parent, also when the graph has none", () => {
      const context = buildAncestorContext(CHILD, graphWith({ ...SELECTED, parent: undefined }), { id: "p2" });

      expect(context).toEqual({ "@Grandparent.id@": "g1", "@Parent.id@": "p2" });
    });

    it("gives no context for a tab without parent or a missing record", () => {
      expect(buildAncestorContext(GRANDPARENT, graphWith(SELECTED))).toEqual({});
      expect(buildRecordContext(CHILD, null)).toEqual({});
    });

    it("lets the record of the tab override an ancestor of the same entity in the whole context", () => {
      const sameEntityChild = idTab("child", "Parent");

      expect(buildEtendoContext(sameEntityChild, graphWith(SELECTED))["@Parent.id@"]).toBe("c1");
    });
  });

  describe("buildParentSessionContext", () => {
    const parentTab = { id: "parentTab", entityName: "aeatsii_config" } as unknown as Tab;

    it("emits the id, client and organization the server substitutes into a child where clause", () => {
      const record = {
        id: "EEA0890DCD7F4BFDB27D5D3AF4032FC9",
        client: "23C59575B9CF467C9620760EB255B389",
        organization: "B843C30461EA4501935CB1D125C9C25A",
        monitordate: "2026-08-18",
      };

      expect(buildParentSessionContext(parentTab, record)).toEqual({
        "@aeatsii_config.id@": "EEA0890DCD7F4BFDB27D5D3AF4032FC9",
        "@aeatsii_config.client@": "23C59575B9CF467C9620760EB255B389",
        "@aeatsii_config.organization@": "B843C30461EA4501935CB1D125C9C25A",
      });
    });

    it("omits properties the record does not carry instead of sending empty values", () => {
      // An empty organization makes AD_ISORGINCLUDED return -1, dropping every row — so the
      // param must be absent (falling back to the session) rather than present and blank.
      expect(buildParentSessionContext(parentTab, { id: "abc", organization: "" })).toEqual({
        "@aeatsii_config.id@": "abc",
      });
    });

    it("returns an empty context without a parent tab or without a record", () => {
      expect(buildParentSessionContext(null, { id: "abc" })).toEqual({});
      expect(buildParentSessionContext(parentTab, null)).toEqual({});
    });
  });
});
