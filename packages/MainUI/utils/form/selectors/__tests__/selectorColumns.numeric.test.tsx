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

import type React from "react";
import { render, screen } from "@testing-library/react";
import { buildSelectorColumnDefs } from "../selectorColumns";
import { createMockSelectorColumn, createMockTranslator } from "../__testHelpers__/selectorColumnsTestHelpers";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { NUMERIC_CELL_CLASSES, NUMERIC_HEADER_CELL_PROPS } from "@/utils/table/numericAlignment";

const AMOUNT = "1,250.00";

/** Builds the only column of a selector grid with the given reference. */
const buildColumn = (referenceId: string) =>
  buildSelectorColumnDefs([createMockSelectorColumn({ accessorKey: "balance", referenceId })], {
    onTextFilterChange: jest.fn(),
    onBooleanFilterChange: jest.fn(),
    columnFilters: [],
    t: createMockTranslator(),
  })[0];

/** Renders the cell of a column for a row holding the amount. */
const renderCell = (column: ReturnType<typeof buildColumn>) => {
  const Cell = column.Cell as unknown as React.FC<{ cell: unknown; row: unknown }>;
  render(<Cell cell={{ getValue: () => AMOUNT }} row={{ original: { balance: AMOUNT } }} />);
  return screen.getByText(AMOUNT);
};

describe("buildSelectorColumnDefs - numeric columns", () => {
  it("right-aligns the header and the value of an amount column", () => {
    const column = buildColumn(FIELD_REFERENCE_CODES.NUMERIC.id);

    expect(column.muiTableHeadCellProps).toEqual(NUMERIC_HEADER_CELL_PROPS);
    expect(renderCell(column)).toHaveClass(...NUMERIC_CELL_CLASSES.split(" "));
  });

  it("leaves a text column as it was", () => {
    const column = buildColumn("10");

    expect(column.muiTableHeadCellProps).toBeUndefined();
    expect(renderCell(column)).not.toHaveClass("text-right");
  });
});
