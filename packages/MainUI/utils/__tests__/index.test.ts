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
  delay,
  getFieldReference,
  sanitizeValue,
  buildPayloadByInputName,
  buildQueryString,
  buildFormPayload,
  getNumericFormatOptions,
  formatNumber,
  getMessageType,
  formatLabel,
  buildProcessPayload,
  buildSingleDeleteQueryString,
  buildDeletePayload,
  buildRequestOptions,
} from "../index";
import { FieldType, FormMode } from "@workspaceui/api-client/src/api/types";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "../form/constants";

const field = (overrides: Record<string, unknown> = {}) => overrides as unknown as Field;
const tab = (overrides: Record<string, unknown> = {}) => overrides as unknown as Tab;

describe("utils/index", () => {
  describe("delay", () => {
    it("resolves after the given time", async () => {
      jest.useFakeTimers();
      const promise = delay(100);
      jest.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
      jest.useRealTimers();
    });
  });

  describe("getFieldReference", () => {
    it.each([
      [FIELD_REFERENCE_CODES.STRING.id, FieldType.TEXT],
      [FIELD_REFERENCE_CODES.PRODUCT.id, FieldType.TABLEDIR],
      [FIELD_REFERENCE_CODES.DATE.id, FieldType.DATE],
      [FIELD_REFERENCE_CODES.DATETIME.id, FieldType.DATETIME],
      [FIELD_REFERENCE_CODES.BOOLEAN.id, FieldType.BOOLEAN],
      [FIELD_REFERENCE_CODES.INTEGER.id, FieldType.NUMBER],
      [FIELD_REFERENCE_CODES.QUANTITY_22.id, FieldType.QUANTITY],
      [FIELD_REFERENCE_CODES.LIST_17.id, FieldType.LIST],
      [FIELD_REFERENCE_CODES.TIME.id, FieldType.TIME],
      [FIELD_REFERENCE_CODES.BUTTON.id, FieldType.BUTTON],
      [FIELD_REFERENCE_CODES.SELECT_30.id, FieldType.SELECT],
      [FIELD_REFERENCE_CODES.WINDOW.id, FieldType.WINDOW],
      [FIELD_REFERENCE_CODES.IMAGE.id, FieldType.IMAGE],
      ["unknown-reference", FieldType.TEXT],
      [undefined, FieldType.TEXT],
    ])("maps %s to %s", (reference, expected) => {
      expect(getFieldReference(reference as string | undefined)).toBe(expected);
    });
  });

  describe("sanitizeValue", () => {
    it("nulls out an empty consumptionDays value matched by inputName", () => {
      expect(sanitizeValue("", field({ inputName: "consumptionDays" }))).toBeNull();
    });

    it("nulls out a null consumptionDays value matched by name", () => {
      expect(sanitizeValue(null, field({ name: "consumptionDays" }))).toBeNull();
    });

    it("converts a numeric consumptionDays value", () => {
      expect(sanitizeValue("5", field({ inputName: "consumptionDays" }))).toBe(5);
    });

    it("keeps a non-numeric consumptionDays value as-is", () => {
      expect(sanitizeValue("abc", field({ inputName: "consumptionDays" }))).toBe("abc");
    });

    it("reverses a DATE value to yyyy-mm-dd order", () => {
      const dateField = field({ column: { reference: FIELD_REFERENCE_CODES.DATE.id } });
      expect(sanitizeValue("31-01-2026", dateField)).toBe("2026-01-31");
    });

    it("returns null for an empty DATE value", () => {
      const dateField = field({ column: { reference: FIELD_REFERENCE_CODES.DATE.id } });
      expect(sanitizeValue("", dateField)).toBeNull();
    });

    it("nulls out an empty QUANTITY value", () => {
      const qtyField = field({ column: { reference: FIELD_REFERENCE_CODES.QUANTITY_22.id } });
      expect(sanitizeValue(undefined, qtyField)).toBeNull();
    });

    it("converts a numeric QUANTITY value", () => {
      const qtyField = field({ column: { reference: FIELD_REFERENCE_CODES.QUANTITY_22.id } });
      expect(sanitizeValue("12.5", qtyField)).toBe(12.5);
    });

    it("maps boolean true/false to Y/N", () => {
      expect(sanitizeValue(true)).toBe("Y");
      expect(sanitizeValue(false)).toBe("N");
    });

    it("passes through values with no special handling", () => {
      expect(sanitizeValue("plain")).toBe("plain");
    });
  });

  describe("buildPayloadByInputName", () => {
    it("returns null when values is missing", () => {
      expect(buildPayloadByInputName(undefined)).toBeNull();
      expect(buildPayloadByInputName(null)).toBeNull();
    });

    it("uses the property-path inputName format for property fields", () => {
      const fields = {
        docType: field({ inputName: "inp_propertyField_type_Type", column: { propertyPath: "Type" } }),
      };
      const result = buildPayloadByInputName({ docType: "ARI" }, fields);
      expect(result).toEqual({ inp_propertyField_type_Type: "ARI" });
    });

    it("renames documentAction to DocAction by key", () => {
      const result = buildPayloadByInputName({ documentAction: "CO" });
      expect(result).toEqual({ DocAction: "CO" });
    });

    it("renames documentAction to DocAction by resolved inputName", () => {
      const fields = { docAction: field({ inputName: "documentAction" }) };
      const result = buildPayloadByInputName({ docAction: "CO" }, fields);
      expect(result).toEqual({ DocAction: "CO" });
    });

    it("renames inpporeference to POReference by key", () => {
      const result = buildPayloadByInputName({ inpporeference: "PO-1" });
      expect(result).toEqual({ POReference: "PO-1" });
    });

    it("nulls out an empty consumptionDays value with no field metadata", () => {
      const result = buildPayloadByInputName({ consumptionDays: "" });
      expect(result).toEqual({ consumptionDays: null });
    });

    it("converts a numeric consumptionDays value with no field metadata", () => {
      const result = buildPayloadByInputName({ consumptionDays: "7" });
      expect(result).toEqual({ consumptionDays: 7 });
    });

    it("falls back to sanitizeValue for regular fields", () => {
      const fields = { isActive: field({ inputName: "inpisactive" }) };
      const result = buildPayloadByInputName({ isActive: true }, fields);
      expect(result).toEqual({ inpisactive: "Y" });
    });
  });

  describe("buildQueryString", () => {
    it("builds params for a new record, including colored extra properties", () => {
      const params = buildQueryString({
        mode: FormMode.NEW,
        windowMetadata: { id: "win-1" } as never,
        tab: tab({
          id: "tab-1",
          module: "mod-1",
          fields: { amount: field({ hqlName: "amount", colorFieldName: "amountColor" }) },
        }),
      });
      expect(params.get("_operationType")).toBe("add");
      expect(params.get("windowId")).toBe("win-1");
      expect(params.get("_extraProperties")).toBe("amount$amountColor");
    });

    it("builds params for an update with no colored fields", () => {
      const params = buildQueryString({
        tab: tab({ id: "tab-1", module: "mod-1", fields: {} }),
        mode: FormMode.EDIT,
      });
      expect(params.get("_operationType")).toBe("update");
      expect(params.get("_extraProperties")).toBe("");
    });
  });

  describe("buildFormPayload", () => {
    it("builds a plain payload when the tab has no fields", () => {
      const payload = buildFormPayload({
        values: { name: "Acme" },
        mode: FormMode.NEW,
        csrfToken: "token",
      });
      expect(payload.data.name).toBe("Acme");
    });

    it("copies an extension field value onto its empty standard field", () => {
      const fields = {
        standard: field({ hqlName: "businessPartner", columnName: "c_bpartner_id" }),
        extension: field({ hqlName: "etcrmCBpartner", columnName: "em_etcrm_c_bpartner_id" }),
      };
      const payload = buildFormPayload({
        values: { businessPartner: "", etcrmCBpartner: "BP-1" },
        mode: FormMode.NEW,
        csrfToken: "token",
        tab: tab({ fields }),
      });
      expect(payload.data.businessPartner).toBe("BP-1");
    });

    it("does not overwrite a standard field that already has a value", () => {
      const fields = {
        standard: field({ hqlName: "businessPartner", columnName: "c_bpartner_id" }),
        extension: field({ hqlName: "etcrmCBpartner", columnName: "em_etcrm_c_bpartner_id" }),
      };
      const payload = buildFormPayload({
        values: { businessPartner: "BP-existing", etcrmCBpartner: "BP-1" },
        mode: FormMode.NEW,
        csrfToken: "token",
        tab: tab({ fields }),
      });
      expect(payload.data.businessPartner).toBe("BP-existing");
    });

    it("ignores extension columns with no matching standard field", () => {
      const fields = {
        extension: field({ hqlName: "emOnly", columnName: "em_mod_orphan" }),
      };
      const payload = buildFormPayload({
        values: { emOnly: "value" },
        mode: FormMode.NEW,
        csrfToken: "token",
        tab: tab({ fields }),
      });
      expect(payload.data.emOnly).toBe("value");
    });
  });

  describe("getNumericFormatOptions", () => {
    it("derives digits from an explicit Java format pattern", () => {
      expect(getNumericFormatOptions(undefined, "#,##0.00")).toEqual({
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    });

    it.each([
      ["12", 2, 2],
      ["800008", 2, 2],
      ["800019", 2, 10],
      ["22", 0, 2],
      ["29", 0, 2],
      ["11", 0, 0],
      ["unknown", 0, 2],
    ])("falls back to reference %s options", (reference, min, max) => {
      expect(getNumericFormatOptions(reference)).toEqual({
        minimumFractionDigits: min,
        maximumFractionDigits: max,
      });
    });
  });

  describe("formatNumber", () => {
    it("formats a number using the given locale and reference", () => {
      expect(formatNumber(1234.5, "en-US", "12")).toBe("1,234.50");
    });
  });

  describe("getMessageType", () => {
    it.each([
      ["error", "error"],
      ["user", "right-user"],
      ["assistant", "left-user"],
    ])("maps sender %s to %s", (sender, expected) => {
      expect(getMessageType(sender)).toBe(expected);
    });
  });

  describe("formatLabel", () => {
    it("interpolates the count into the %s placeholder", () => {
      expect(formatLabel("%s items", 3)).toBe("3 items");
    });

    it("returns undefined when there is no placeholder", () => {
      expect(formatLabel("no placeholder", 3)).toBeUndefined();
    });

    it("returns undefined when count is not provided", () => {
      expect(formatLabel("%s items")).toBeUndefined();
    });
  });

  describe("buildProcessPayload", () => {
    it("uses the tab's key column and marks present optional elements", () => {
      const fields = {
        id: field({ columnName: "c_invoice_id", inputName: "inpcInvoiceId", column: { keyColumn: true } }),
      };
      const result = buildProcessPayload(
        { id: "123", docBaseType: "ARI", cBpartnerId: "BP-1", adOrgId: "ORG-1" },
        tab({ id: "tab-1", window: "win-1", table: "table-1", entityName: "C_Invoice", fields })
      );
      expect(result.inpkeyColumnId).toBe("c_invoice_id");
      expect(result.DOCBASETYPE).toBe("ARI");
      expect(result.$Element_BP).toBe("Y");
      expect(result.$Element_PJ).toBe("");
    });

    it("falls back to the entityName-based key column when none is marked", () => {
      const result = buildProcessPayload(
        { id: "123" },
        tab({ id: "tab-1", window: "win-1", table: "table-1", entityName: "C_Order", fields: {} })
      );
      expect(result.inpkeyColumnId).toBe("C_Order_ID");
      expect(result.DOCBASETYPE).toBe("");
      expect(result.$Element_BP).toBe("");
    });
  });

  describe("buildSingleDeleteQueryString", () => {
    it("prefers windowMetadata.id over tab.window", () => {
      const params = buildSingleDeleteQueryString({
        windowMetadata: { id: "win-meta" } as never,
        tab: tab({ id: "tab-1", window: "win-tab", module: "mod-1" }),
        recordId: "rec-1",
      });
      expect(params.get("windowId")).toBe("win-meta");
      expect(params.get("moduleId")).toBe("mod-1");
    });

    it("falls back to tab.window and a default module", () => {
      const params = buildSingleDeleteQueryString({
        tab: tab({ id: "tab-1", window: "win-tab" }),
        recordId: "rec-1",
      });
      expect(params.get("windowId")).toBe("win-tab");
      expect(params.get("moduleId")).toBe("0");
    });
  });

  describe("buildDeletePayload", () => {
    it("builds the delete payload for a record", () => {
      expect(buildDeletePayload({ recordId: "rec-1", csrfToken: "token" })).toEqual({
        dataSource: "isc_OBViewDataSource_0",
        operationType: "remove",
        componentId: "isc_OBViewGrid_0",
        data: { id: "rec-1" },
        csrfToken: "token",
      });
    });
  });

  describe("buildRequestOptions", () => {
    it("builds fetch options wrapping the form payload", () => {
      const signal = new AbortController().signal;
      const options = buildRequestOptions({ name: "Acme" }, {}, FormMode.NEW, "user-1", signal);
      expect(options.method).toBe("POST");
      expect(options.signal).toBe(signal);
      expect(JSON.parse(JSON.stringify(options.body)).data.name).toBe("Acme");
    });
  });
});
