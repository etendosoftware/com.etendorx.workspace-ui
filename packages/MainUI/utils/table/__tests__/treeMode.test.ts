import { type Tab, UIPattern } from "@workspaceui/api-client/src/api/types";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import {
  canMoveTreeNodes,
  DEFAULT_TREE_FETCH_LIMIT,
  getFetchPageSize,
  getTreeFetchLimit,
  getTreeMetadata,
  isTooManyNodesResponse,
  isTreeModeSupported,
} from "../treeMode";

const TREE_DATASOURCE_ID = "90034CAE96E847D78FBEF6D38CB1930D";
const TABLE_ID = "155";

const buildTab = (overrides: Partial<Tab> = {}): Tab =>
  ({
    id: "tab-1",
    window: "window-1",
    entityName: "ProductCategory",
    table: TABLE_ID,
    uIPattern: UIPattern.STANDARD,
    ...overrides,
  }) as Tab;

const buildTreeTab = (overrides: Partial<Tab> = {}): Tab =>
  buildTab({ hasTree: true, treeDatasourceId: TREE_DATASOURCE_ID, tableId: TABLE_ID, ...overrides });

describe("treeMode", () => {
  describe("isTreeModeSupported", () => {
    it("returns true when the adapter emits hasTree and the tree datasource", () => {
      expect(isTreeModeSupported(buildTreeTab())).toBe(true);
    });

    it.each([
      ["hasTree is absent", buildTab()],
      ["hasTree is false", buildTreeTab({ hasTree: false })],
      ["the tree datasource is missing", buildTreeTab({ treeDatasourceId: undefined })],
      ["only the raw tableTree reference is present", buildTab({ tableTree: "tree-1" })],
    ])("returns false when %s", (_, tab) => {
      expect(isTreeModeSupported(tab)).toBe(false);
    });

    it("returns false when there is no tab", () => {
      expect(isTreeModeSupported()).toBe(false);
    });

    it("ignores tree-like names when the metadata has no tree", () => {
      expect(isTreeModeSupported(buildTab({ entityName: "BusinessPartnerCategory", table: "C_BP_Group" }))).toBe(false);
    });
  });

  describe("canMoveTreeNodes", () => {
    it("allows moving nodes on an editable tree", () => {
      expect(canMoveTreeNodes(buildTreeTab({ isReadOnlyTree: false }))).toBe(true);
    });

    it.each([
      ["the tree is read-only", buildTreeTab({ isReadOnlyTree: true })],
      ["the tab is read-only", buildTreeTab({ uIPattern: UIPattern.READ_ONLY })],
    ])("forbids moving nodes when %s", (_, tab) => {
      expect(canMoveTreeNodes(tab)).toBe(false);
    });
  });

  describe("getTreeMetadata", () => {
    it("builds the tree metadata from the adapter fields", () => {
      expect(getTreeMetadata(buildTreeTab())).toEqual({
        supportsTreeMode: true,
        treeEntity: TREE_DATASOURCE_ID,
        referencedTableId: TABLE_ID,
        canMoveNodes: true,
      });
    });

    it("reports a read-only tree", () => {
      expect(getTreeMetadata(buildTreeTab({ isReadOnlyTree: true })).canMoveNodes).toBe(false);
    });

    it("returns no tree support when the tab has no tree", () => {
      expect(getTreeMetadata(buildTab())).toEqual({ supportsTreeMode: false, canMoveNodes: false });
    });
  });

  describe("tree fetch limit", () => {
    const WINDOW_ID = "144";

    beforeEach(() => {
      installLocalStorageMock();
    });

    it("reads TreeDatasourceFetchLimit and defaults to the classic 200", () => {
      savePreferences({});
      expect(getTreeFetchLimit()).toBe(DEFAULT_TREE_FETCH_LIMIT);
      savePreferences({ TreeDatasourceFetchLimit: "3" });
      expect(getTreeFetchLimit()).toBe(3);
    });

    it("asks a tree for the fetch limit and a grid for its page size", () => {
      savePreferences({ TreeDatasourceFetchLimit: "3", [`dataPageSize_${WINDOW_ID}`]: "20" });
      expect(getFetchPageSize(true, WINDOW_ID)).toBe(3);
      expect(getFetchPageSize(false, WINDOW_ID)).toBe(20);
    });
  });

  describe("isTooManyNodesResponse", () => {
    it("recognizes the answer of a tree over the limit", () => {
      expect(isTooManyNodesResponse({ response: { status: -1, error: { type: "tooManyNodes" }, data: [] } })).toBe(
        true
      );
    });

    it.each([null, {}, { response: { data: [] } }, { response: { error: { type: "other" } } }])(
      "ignores any other answer: %p",
      (body) => {
        expect(isTooManyNodesResponse(body)).toBe(false);
      }
    );
  });
});
