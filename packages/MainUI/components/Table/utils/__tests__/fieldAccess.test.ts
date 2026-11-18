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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { isFieldReadOnly, isHiddenByDisplayLogic } from "../fieldAccess";

const field = (overrides: Record<string, unknown>) =>
  ({ name: "Product", isUpdatable: true, ...overrides }) as unknown as Field;

/** The fields of an invoice lines tab: the row stores its values by property name, the logic names the columns. */
const tabFields = {
  financialInvoiceLine: { hqlName: "financialInvoiceLine", columnName: "Financial_Invoice_Line", name: "Financial" },
  processed: { hqlName: "processed", columnName: "Processed", name: "Processed" },
} as unknown as Record<string, Field>;

describe("fieldAccess (ETP-6334)", () => {
  describe("display logic that names a column of the row", () => {
    const product = field({ displayLogicExpression: "@Financial_Invoice_Line@='N'" });

    it("keeps the field visible when the column is 'N' in the row, as the form view does", () => {
      const row = { financialInvoiceLine: false };

      expect(isHiddenByDisplayLogic(product, row, {}, "167", tabFields)).toBe(false);
      expect(isFieldReadOnly(product, true, row, {}, "167", tabFields)).toBe(false);
    });

    it("hides the field when the column is 'Y'", () => {
      const row = { financialInvoiceLine: true };

      expect(isHiddenByDisplayLogic(product, row, {}, "167", tabFields)).toBe(true);
      expect(isFieldReadOnly(product, true, row, {}, "167", tabFields)).toBe(true);
    });

    it("reads the value by its column name too", () => {
      expect(isHiddenByDisplayLogic(product, { Financial_Invoice_Line: "N" }, {}, "167", tabFields)).toBe(false);
    });

    it("keeps the previous behaviour, which cannot find the column, when the fields are not given", () => {
      expect(isHiddenByDisplayLogic(product, { financialInvoiceLine: false }, {}, "167")).toBe(true);
    });
  });

  describe("read-only logic", () => {
    const quantity = field({ readOnlyLogicExpression: "@Processed@='Y'" });

    it("is editable while the document is not processed", () => {
      expect(isFieldReadOnly(quantity, false, { processed: false }, {}, "167", tabFields)).toBe(false);
    });

    it("is read-only once the document is processed", () => {
      expect(isFieldReadOnly(quantity, false, { processed: true }, {}, "167", tabFields)).toBe(true);
    });

    it("is read-only when the field says so, and not updatable once the row exists", () => {
      expect(isFieldReadOnly(field({ isReadOnly: true }), true, {}, {}, "167", tabFields)).toBe(true);
      expect(isFieldReadOnly(field({ isUpdatable: false }), false, {}, {}, "167", tabFields)).toBe(true);
      expect(isFieldReadOnly(field({ isUpdatable: false }), true, {}, {}, "167", tabFields)).toBe(false);
    });
  });
});
