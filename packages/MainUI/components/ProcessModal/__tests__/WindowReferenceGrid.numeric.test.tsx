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

import type { Column } from "@workspaceui/api-client/src/api/types";
import { getReadOnlyCell, withColumnReference } from "../WindowReferenceGrid";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

const AMOUNT_REFERENCE = FIELD_REFERENCE_CODES.NUMERIC.id;
const TEXT_REFERENCE = "10";

const numericCell = () => null;

/** Read-only column of a process grid with the given reference and cell kept by `useColumns`. */
const buildColumn = (reference: string, fallbackCell?: unknown) =>
  ({ id: "total", column: { reference }, fallbackCell }) as unknown as Column;

describe("WindowReferenceGrid numeric columns", () => {
  describe("getReadOnlyCell", () => {
    it("keeps the formatted, right-aligned cell of a numeric column", () => {
      expect(getReadOnlyCell(buildColumn(AMOUNT_REFERENCE, numericCell))).toBe(numericCell);
    });

    it("shows a text column as plain text", () => {
      expect(getReadOnlyCell(buildColumn(TEXT_REFERENCE, numericCell))).not.toBe(numericCell);
    });

    it("falls back to plain text when a numeric column has no cell to keep", () => {
      const cell = getReadOnlyCell(buildColumn(AMOUNT_REFERENCE));

      expect(cell).toBe(getReadOnlyCell(buildColumn(TEXT_REFERENCE)));
    });
  });

  describe("withColumnReference", () => {
    it("completes the column with the reference the field carries", () => {
      expect(
        withColumnReference({ column: { dBColumnName: "GrandTotal" } as never, reference: AMOUNT_REFERENCE })
      ).toEqual({ dBColumnName: "GrandTotal", reference: AMOUNT_REFERENCE });
    });

    it("keeps a column that already has its reference", () => {
      const column = { reference: TEXT_REFERENCE } as never;

      expect(withColumnReference({ column, reference: AMOUNT_REFERENCE })).toBe(column);
    });

    it("keeps the column as it is when the field has no reference either", () => {
      const column = { dBColumnName: "Name" } as never;

      expect(withColumnReference({ column })).toBe(column);
    });
  });
});
