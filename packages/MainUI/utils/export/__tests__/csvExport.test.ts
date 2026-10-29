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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { DatasourceOptions, Field, Tab } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import {
  CSV_EXPORT_FORMAT,
  CSV_FILE_NAME,
  buildCsvExportParams,
  buildFieldNameVisibility,
  buildFieldsArray,
  buildViewState,
  downloadCSVFile,
  exportGridToCsv,
  extractCSVContent,
  extractErrorFromResponse,
  getExportFieldNames,
} from "../csvExport";

jest.mock("@workspaceui/api-client/src/api/datasource", () => ({ datasource: { get: jest.fn() } }));
jest.mock("@/utils/logger");

const CSV = "Document No.,Business Partner\n1001,Sleep Well Hotels, Co.";
const ENTITY = "Order";
const TAB_ID = "186";
const DOCUMENT_NO = "documentNo";
const BUSINESS_PARTNER = "businessPartner";
const BP_LABEL = "Business Partner";
const BACKEND_ERROR = "Boom";
const VIEW_STATE = '({field:"[]"})';
const EXPORT_FAILED = "CSV Export failed";

const mockTab = {
  id: TAB_ID,
  entityName: ENTITY,
  fields: {
    id: { name: "id" },
    [DOCUMENT_NO]: { label: "Document No.", type: "string" },
    [BUSINESS_PARTNER]: { label: BP_LABEL, type: "tabledir" },
    _editLink: {},
  },
} as unknown as Tab;

const gridParams: DatasourceOptions = {
  windowId: "143",
  tabId: TAB_ID,
  criteria: [{ fieldName: BUSINESS_PARTNER, operator: "equals", value: "BP1" }],
  sortBy: `-orderDate,${DOCUMENT_NO}`,
  isImplicitFilterApplied: true,
  pageSize: 100,
  startRow: 0,
  endRow: 100,
  targetRecordId: "REC1",
  directNavigation: true,
};

const mockGet = datasource.get as jest.Mock;

/** Response the datasource proxy returns for a CSV body (it wraps any non-JSON text). */
const proxiedCsv = (text: string) => ({ ok: true, data: { text } });

/** Error response shape `{ response: { error: { message } } }`. */
const errorResponse = (message?: string) => ({ response: { error: { message } } });

const runExport = () =>
  exportGridToCsv({ tab: mockTab, tableState: { visibility: { [BP_LABEL]: false }, sorting: [] }, gridParams });

describe("csvExport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.URL.createObjectURL = jest.fn(() => "blob:csv");
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => jest.useRealTimers());

  describe("buildCsvExportParams", () => {
    it("keeps the grid query and drops paging, as Classic exports every matching row", () => {
      const params = buildCsvExportParams(gridParams, { tabId: TAB_ID, viewState: VIEW_STATE });

      expect(params).toMatchObject({
        criteria: gridParams.criteria,
        sortBy: gridParams.sortBy,
        isImplicitFilterApplied: true,
        windowId: "143",
      });
      for (const key of ["pageSize", "startRow", "endRow", "targetRecordId", "directNavigation"]) {
        expect(params).not.toHaveProperty(key);
      }
    });

    it("adds the Classic export params", () => {
      const params = buildCsvExportParams({ _startRow: 0, _endRow: 9999 }, { tabId: TAB_ID, viewState: VIEW_STATE });

      expect(params).toMatchObject({
        _operationType: "fetch",
        _noCount: true,
        exportAs: CSV_EXPORT_FORMAT,
        exportToFile: true,
        viewState: VIEW_STATE,
        tabId: TAB_ID,
        _textMatchStyle: "substring",
        _UTCOffsetMiliseconds: String(new Date().getTimezoneOffset() * -60000),
      });
      expect(params).not.toHaveProperty("_startRow");
      expect(params).not.toHaveProperty("_endRow");
    });
  });

  describe("getExportFieldNames", () => {
    /** Field of a tab: its grid column id (`name`), grid and form sequences and reference. */
    const gridField = (name: string, gridPosition: number | null, sequenceNumber: number, reference = "10") =>
      ({ name, gridPosition, sequenceNumber, column: { reference } }) as unknown as Field;

    const tabFields: Record<string, Field> = {
      id: gridField("ID", 0, 0),
      transactionDocument: gridField("Transaction Document", 30, 20),
      documentNo: gridField("Document No.", 20, 30),
      bankAccount: gridField("Bank Account", 2100, 55),
      generatePickingList: gridField("Generate Picking List", 0, 470, FIELD_REFERENCE_CODES.BUTTON.id),
      logo: gridField("Logo", 10, 10, FIELD_REFERENCE_CODES.IMAGE.id),
      pendingPickingList: gridField("Pending Picking List", null, 500),
    };

    it("follows the grid order and leaves out the id and the columns the grid never shows", () => {
      expect(getExportFieldNames(tabFields)).toEqual([
        "documentNo",
        "transactionDocument",
        "pendingPickingList",
        "bankAccount",
      ]);
    });

    it("follows the order the user gave the columns, keeping the others after them", () => {
      const columnOrder = ["mrt-row-select", "Bank Account", "Transaction Document"];

      expect(getExportFieldNames(tabFields, columnOrder)).toEqual([
        "bankAccount",
        "transactionDocument",
        "documentNo",
        "pendingPickingList",
      ]);
      const unnamed = { column: { reference: "10" }, gridPosition: 1 } as unknown as Field;
      expect(getExportFieldNames({ unnamed, ...tabFields }, columnOrder)[2]).toBe("unnamed");
    });

    it("hides the columns the user hid in the grid, keyed by the column id", () => {
      const fields = { documentNo: { name: "Document No.", showInGridView: true } };

      expect(buildFieldNameVisibility(["documentNo"], { "Document No.": false }, fields)).toEqual({
        documentNo: false,
      });
    });
  });

  describe("view state", () => {
    it("maps the display-name visibility to field names, defaulting to the metadata", () => {
      const fields = {
        a: { label: "A", showInGridView: true },
        b: { label: "B" },
        c: { showInGridView: false },
        d: { label: 42 },
      };

      expect(buildFieldNameVisibility(["a", "b", "c", "d"], { A: false, 42: false }, fields)).toEqual({
        a: false,
        b: true,
        c: false,
        d: true,
      });
      expect(buildFieldNameVisibility(["missing"], {}, fields)).toEqual({ missing: true });
    });

    it("lists the entity fields with their width and visibility", () => {
      const fields = { flag: { type: "boolean" }, amount: { type: "number" }, name: { type: "string" } };

      expect(buildFieldsArray(["flag", "amount", "name", "actions"], { name: false }, fields)).toEqual([
        { name: "flag", visible: true, width: 100, autoFitWidth: false },
        { name: "amount", visible: true, width: 100 },
        { name: "name", visible: false, width: 200 },
      ]);
      expect(buildFieldsArray(["name"], {}, undefined)).toEqual([{ name: "name", visible: true, width: 200 }]);
    });

    it("serializes the fields and every sort in the SmartClient format", () => {
      const fields = [{ name: DOCUMENT_NO, visible: true }];

      expect(buildViewState(fields, [])).toBe(
        '({field:"[{\\"name\\":\\"documentNo\\",\\"visible\\":true}]",sort:"(null)",hilite:null,group:{groupByFields:"",groupingModes:{}},filterClause:null,summaryFunctions:{}})'
      );
      const sorted = buildViewState(fields, [
        { id: "orderDate", desc: true },
        { id: DOCUMENT_NO, desc: false },
      ]);
      expect(sorted).toContain('\\"sortDir\\":\\"descending\\"');
      expect(sorted).toContain('{\\"property\\":\\"documentNo\\",\\"direction\\":\\"ascending\\"}');
    });
  });

  describe("response parsing", () => {
    it("reads the CSV from every response shape", () => {
      expect(extractCSVContent(CSV).csvContent).toBe(CSV);
      expect(extractCSVContent({ data: CSV }).csvContent).toBe(CSV);
      expect(extractCSVContent(proxiedCsv(CSV)).csvContent).toBe(CSV);
      expect(extractCSVContent({ data: { data: CSV } }).csvContent).toBe(CSV);
      expect(extractCSVContent({ data: { csv: CSV } }).csvContent).toBe(CSV);
      expect(extractCSVContent({ data: {}, text: CSV }).csvContent).toBe(CSV);
      expect(extractCSVContent({ csv: CSV }).csvContent).toBe(CSV);
      expect(extractCSVContent({})).toEqual({ csvContent: "", backendError: null });
    });

    it("reads the backend error from the nested and the top-level response", () => {
      expect(extractErrorFromResponse({ data: errorResponse(BACKEND_ERROR) })).toBe(BACKEND_ERROR);
      expect(extractErrorFromResponse(errorResponse(BACKEND_ERROR))).toBe(BACKEND_ERROR);
      expect(extractErrorFromResponse(errorResponse())).toBe("Unknown backend error");
      expect(extractErrorFromResponse({ data: { response: { error: "text" } } })).toBeNull();
      expect(extractCSVContent(proxiedCsv(CSV)).backendError).toBeNull();
    });
  });

  describe("downloadCSVFile", () => {
    it("rejects an empty file", () => {
      expect(() => downloadCSVFile("  ")).toThrow("No data to export");
    });

    it("downloads the CSV and releases the object URL", () => {
      const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      downloadCSVFile(CSV);

      expect(click).toHaveBeenCalled();
      const link = click.mock.instances[0] as unknown as HTMLAnchorElement;
      expect(link.getAttribute("download")).toBe(CSV_FILE_NAME);
      jest.runAllTimers();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv");
      click.mockRestore();
    });
  });

  describe("exportGridToCsv", () => {
    it("requests the tab entity with the grid query and downloads the file", async () => {
      const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      mockGet.mockResolvedValue(proxiedCsv(CSV));

      await runExport();

      const [entity, params] = mockGet.mock.calls[0];
      expect(entity).toBe(ENTITY);
      expect(params).toMatchObject({ criteria: gridParams.criteria, sortBy: gridParams.sortBy, tabId: TAB_ID });
      expect(params).not.toHaveProperty("startRow");
      expect(params.viewState).toContain('\\"name\\":\\"documentNo\\",\\"visible\\":true');
      expect(params.viewState).toContain('\\"name\\":\\"businessPartner\\",\\"visible\\":false');
      expect(params.viewState).not.toContain('\\"name\\":\\"id\\"');
      expect(click).toHaveBeenCalled();
      click.mockRestore();
    });

    it.each([
      ["no response", undefined, "No response from server"],
      ["a proxy error", { __error: BACKEND_ERROR }, `Export error: ${BACKEND_ERROR}`],
      ["a backend error", { data: errorResponse(BACKEND_ERROR) }, `CSV export backend error: ${BACKEND_ERROR}`],
      ["an empty file", proxiedCsv(" "), "Export returned empty data"],
      ["a response without CSV", { ok: true }, "Export returned empty data"],
    ])("fails on %s", async (_case, response, message) => {
      mockGet.mockResolvedValue(response);

      await expect(runExport()).rejects.toThrow(`${EXPORT_FAILED}: ${message}`);
    });

    it("fails without an entity or fields, before calling the server", async () => {
      const noFields = { ...mockTab, fields: {} } as unknown as Tab;
      const noEntity = { ...mockTab, entityName: "" } as unknown as Tab;

      await expect(exportGridToCsv({ tab: noFields, tableState: {}, gridParams })).rejects.toThrow(
        "No fields available for export"
      );
      await expect(exportGridToCsv({ tab: noEntity, tableState: {}, gridParams })).rejects.toThrow(
        "Entity name not found"
      );
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("exports every field visible when the grid has no table state yet", async () => {
      jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      mockGet.mockResolvedValue(proxiedCsv(CSV));

      await exportGridToCsv({ tab: mockTab, tableState: {}, gridParams });

      expect(mockGet.mock.calls[0][1].viewState).toContain('\\"name\\":\\"businessPartner\\",\\"visible\\":true');
      jest.restoreAllMocks();
    });

    it("reports a non-Error failure as unknown", async () => {
      mockGet.mockRejectedValue("network down");

      await expect(runExport()).rejects.toThrow(`${EXPORT_FAILED}: Unknown error occurred during export`);
    });
  });
});
