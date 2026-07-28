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
  getFieldReference,
  sanitizeValue,
  getNumericFormatOptions,
  formatNumber,
  formatTime,
  getMessageType,
  formatLabel,
  buildQueryString,
  parseDynamicExpression,
  buildPayloadByInputName,
  buildSingleDeleteQueryString,
  buildDeletePayload,
  buildProcessPayload,
} from "../index";
import { FIELD_REFERENCE_CODES } from "../form/constants";
import { FieldType, FormMode, type Field, type Tab } from "@workspaceui/api-client/src/api/types";

const fieldWithReference = (reference: string, extra: Partial<Field> = {}): Field =>
  ({ column: { reference }, ...extra }) as unknown as Field;

describe("utils/index", () => {
  describe("getFieldReference", () => {
    it("maps reference codes to the expected FieldType", () => {
      expect(getFieldReference(FIELD_REFERENCE_CODES.STRING.id)).toBe(FieldType.TEXT);
      expect(getFieldReference(FIELD_REFERENCE_CODES.TABLE_DIR_19.id)).toBe(FieldType.TABLEDIR);
      expect(getFieldReference(FIELD_REFERENCE_CODES.DATE.id)).toBe(FieldType.DATE);
      expect(getFieldReference(FIELD_REFERENCE_CODES.DATETIME.id)).toBe(FieldType.DATETIME);
      expect(getFieldReference(FIELD_REFERENCE_CODES.BOOLEAN.id)).toBe(FieldType.BOOLEAN);
      expect(getFieldReference(FIELD_REFERENCE_CODES.INTEGER.id)).toBe(FieldType.NUMBER);
      expect(getFieldReference(FIELD_REFERENCE_CODES.QUANTITY_22.id)).toBe(FieldType.QUANTITY);
      expect(getFieldReference(FIELD_REFERENCE_CODES.LIST_17.id)).toBe(FieldType.LIST);
      expect(getFieldReference(FIELD_REFERENCE_CODES.TIME.id)).toBe(FieldType.TIME);
      expect(getFieldReference(FIELD_REFERENCE_CODES.BUTTON.id)).toBe(FieldType.BUTTON);
      expect(getFieldReference(FIELD_REFERENCE_CODES.IMAGE.id)).toBe(FieldType.IMAGE);
    });

    it("falls back to TEXT for unknown or missing references", () => {
      expect(getFieldReference("unknown-code")).toBe(FieldType.TEXT);
      expect(getFieldReference(undefined)).toBe(FieldType.TEXT);
    });
  });

  describe("sanitizeValue", () => {
    it("maps boolean-like strings to Y/N and null to null", () => {
      expect(sanitizeValue(true)).toBe("Y");
      expect(sanitizeValue(false)).toBe("N");
      expect(sanitizeValue(null)).toBeNull();
    });

    it("reverses date segments for DATE fields", () => {
      const field = fieldWithReference(FIELD_REFERENCE_CODES.DATE.id);
      expect(sanitizeValue("2024-01-15", field)).toBe("15-01-2024");
      expect(sanitizeValue("", field)).toBeNull();
    });

    it("coerces numeric fields, preserving non-numeric input and nulling empties", () => {
      const field = fieldWithReference(FIELD_REFERENCE_CODES.NUMERIC.id);
      expect(sanitizeValue("42", field)).toBe(42);
      expect(sanitizeValue("", field)).toBeNull();
      expect(sanitizeValue("abc", field)).toBe("abc");
    });

    it("handles the consumptionDays special case by name", () => {
      const field = { name: "consumptionDays" } as unknown as Field;
      expect(sanitizeValue("5", field)).toBe(5);
      expect(sanitizeValue("", field)).toBeNull();
    });
  });

  describe("getNumericFormatOptions", () => {
    it("derives fraction digits from a Java value-format pattern", () => {
      expect(getNumericFormatOptions(undefined, "#0.00")).toEqual({
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(getNumericFormatOptions(undefined, "#0")).toEqual({
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    });

    it("uses reference-based defaults when no pattern is given", () => {
      expect(getNumericFormatOptions("12")).toEqual({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
      expect(getNumericFormatOptions("800019")).toEqual({ minimumFractionDigits: 2, maximumFractionDigits: 10 });
      expect(getNumericFormatOptions("22")).toEqual({ minimumFractionDigits: 0, maximumFractionDigits: 2 });
      expect(getNumericFormatOptions("11")).toEqual({ minimumFractionDigits: 0, maximumFractionDigits: 0 });
      expect(getNumericFormatOptions("999")).toEqual({ minimumFractionDigits: 0, maximumFractionDigits: 2 });
    });
  });

  describe("formatNumber", () => {
    it("formats using the reference precision and explicit locale", () => {
      expect(formatNumber(1234.5, "en-US", "12")).toBe("1,234.50");
    });
  });

  describe("formatTime", () => {
    it("zero-pads hours and minutes", () => {
      expect(formatTime(new Date(2024, 0, 1, 9, 5))).toBe("09:05");
      expect(formatTime(new Date(2024, 0, 1, 14, 30))).toBe("14:30");
    });
  });

  describe("getMessageType", () => {
    it("classifies the sender", () => {
      expect(getMessageType("error")).toBe("error");
      expect(getMessageType("user")).toBe("right-user");
      expect(getMessageType("assistant")).toBe("left-user");
    });
  });

  describe("formatLabel", () => {
    it("interpolates %s only when a count is provided", () => {
      expect(formatLabel("Items %s", 3)).toBe("Items 3");
      expect(formatLabel("Items %s")).toBeUndefined();
      expect(formatLabel("Items", 3)).toBeUndefined();
    });
  });

  describe("buildQueryString", () => {
    const tab = { id: "T1", module: "M1", fields: {} } as unknown as Tab;

    it("uses the add operation for NEW and update otherwise", () => {
      expect(buildQueryString({ mode: FormMode.NEW, tab }).get("_operationType")).toBe("add");
      expect(buildQueryString({ mode: FormMode.EDIT, tab }).get("_operationType")).toBe("update");
    });

    it("includes tab/window identifiers and color extra-properties", () => {
      const tabWithColor = {
        id: "T2",
        module: "M2",
        fields: { status: { hqlName: "status", colorFieldName: "statusColor" } },
      } as unknown as Tab;
      const params = buildQueryString({ mode: FormMode.NEW, tab: tabWithColor, windowMetadata: { id: "W1" } as never });
      expect(params.get("tabId")).toBe("T2");
      expect(params.get("windowId")).toBe("W1");
      expect(params.get("_extraProperties")).toBe("status$statusColor");
    });
  });

  describe("parseDynamicExpression", () => {
    it("rewrites @field@ references to currentValues/context lookups", () => {
      expect(parseDynamicExpression("@field@")).toBe('(currentValues["field"] ?? context["field"])');
    });

    it("normalizes single logical operators to their JS form", () => {
      expect(parseDynamicExpression("@a@&@b@")).toBe(
        '(currentValues["a"] ?? context["a"])&&(currentValues["b"] ?? context["b"])'
      );
    });

    it("normalizes boolean comparisons against Y/N", () => {
      expect(parseDynamicExpression("@x@ == true")).toBe('(currentValues["x"] ?? context["x"]) == \'Y\'');
    });
  });

  describe("buildPayloadByInputName", () => {
    it("returns null when there are no values", () => {
      expect(buildPayloadByInputName(null)).toBeNull();
      expect(buildPayloadByInputName(undefined)).toBeNull();
    });

    it("maps values to inputName keys and sanitizes booleans", () => {
      const fields = { isActive: { inputName: "inpisactive", column: { reference: "20" } } } as never;
      expect(buildPayloadByInputName({ isActive: true }, fields)).toEqual({ inpisactive: "Y" });
    });

    it("renames documentAction to DocAction", () => {
      expect(buildPayloadByInputName({ documentAction: "CO" })).toEqual({ DocAction: "CO" });
    });

    it("handles consumptionDays without field metadata", () => {
      expect(buildPayloadByInputName({ consumptionDays: "7" })).toEqual({ consumptionDays: 7 });
      expect(buildPayloadByInputName({ consumptionDays: "" })).toEqual({ consumptionDays: null });
    });

    it("uses the property-field inputName when propertyPath is present", () => {
      const fields = {
        type: { inputName: "inp_propertyField_type_Type", column: { propertyPath: "docType.type" } },
      } as never;
      expect(buildPayloadByInputName({ type: "X" }, fields)).toEqual({ inp_propertyField_type_Type: "X" });
    });
  });

  describe("buildSingleDeleteQueryString", () => {
    it("builds a remove query string with record and tab identifiers", () => {
      const tab = { id: "T1", module: "M1", window: "W1" } as unknown as Tab;
      const params = buildSingleDeleteQueryString({ tab, recordId: "R1" });
      expect(params.get("_operationType")).toBe("remove");
      expect(params.get("id")).toBe("R1");
      expect(params.get("tabId")).toBe("T1");
      expect(params.get("windowId")).toBe("W1");
    });
  });

  describe("buildDeletePayload", () => {
    it("builds the remove payload", () => {
      expect(buildDeletePayload({ recordId: "R1", csrfToken: "tok" })).toEqual({
        dataSource: "isc_OBViewDataSource_0",
        operationType: "remove",
        componentId: "isc_OBViewGrid_0",
        data: { id: "R1" },
        csrfToken: "tok",
      });
    });
  });

  describe("buildProcessPayload", () => {
    const tab = {
      id: "T1",
      window: "W1",
      table: "TB1",
      entityName: "C_Order",
      fields: { businessPartner: { inputName: "inpcBpartnerId", column: { reference: "19" } } },
    } as unknown as Tab;

    it("merges record values, system context, defaults and user input", () => {
      const record = { id: "R1", businessPartner: "BP1", cBpartnerId: "BP1", docBaseType: "ARI" };
      const payload = buildProcessPayload(record, tab, { defaultKey: "d" }, { userKey: "u" });

      expect(payload.inpcBpartnerId).toBe("BP1");
      expect(payload.inpTabId).toBe("T1");
      expect(payload.inpwindowId).toBe("W1");
      expect(payload.inpTableId).toBe("TB1");
      expect(payload.keyProperty).toBe("id");
      expect(payload.DOCBASETYPE).toBe("ARI");
      expect(payload.$Element_BP).toBe("Y");
      expect(payload.$Element_OO).toBe("");
      expect(payload.inpkeyColumnId).toBe("C_Order_ID");
      expect(payload.inporderId).toBe("R1");
      expect(payload.defaultKey).toBe("d");
      expect(payload.userKey).toBe("u");
    });

    it("uses the key-column field metadata when a keyColumn field exists", () => {
      const tabWithKey = {
        id: "T2",
        window: "W2",
        table: "TB2",
        entityName: "M_Product",
        fields: {
          productId: { inputName: "inpmProductId", columnName: "M_Product_ID", column: { keyColumn: true } },
        },
      } as unknown as Tab;

      const payload = buildProcessPayload({ id: "P1" }, tabWithKey);
      expect(payload.inpkeyColumnId).toBe("M_Product_ID");
      expect(payload.keyColumnName).toBe("M_Product_ID");
      expect(payload.inpKeyName).toBe("inpmProductId");
    });
  });
});
