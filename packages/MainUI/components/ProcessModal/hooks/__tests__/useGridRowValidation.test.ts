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

import { renderHook } from "@testing-library/react";
import type { EntityData, Field } from "@workspaceui/api-client/src/api/types";
import { useGridRowValidation } from "../useGridRowValidation";

const buildField = (overrides: Partial<Field> = {}): Field =>
  ({
    hqlName: "amount",
    inputName: "inpAmount",
    columnName: "amount",
    isMandatory: true,
    isUpdatable: true,
    displayed: true,
    isReadOnly: false,
    isDisplayed: true,
    name: "Amount",
    id: "F1",
    sequenceNumber: 1,
    ...overrides,
  }) as Field;

const buildRow = (id: string, data: Record<string, unknown> = {}): EntityData =>
  ({ id, ...data }) as unknown as EntityData;

describe("useGridRowValidation (single grid)", () => {
  it("reports no invalid selection when nothing is selected", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({ grids: [{ selectedRows: [], fields: { amount: buildField() } }] })
    );
    expect(result.current.hasInvalidSelection).toBe(false);
    expect(result.current.invalidCellsByRow.size).toBe(0);
  });

  it("reports no invalid selection when no fields are defined", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({ grids: [{ selectedRows: [buildRow("r1")], fields: undefined }] })
    );
    expect(result.current.hasInvalidSelection).toBe(false);
  });

  it("flags a row with an empty mandatory cell", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("r1", { amount: "" })],
            fields: { amount: buildField() },
          },
        ],
      })
    );
    expect(result.current.hasInvalidSelection).toBe(true);
    expect(result.current.invalidCellsByRow.get("r1")?.has("amount")).toBe(true);
  });

  it("treats null and undefined cell values as empty", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("r1", { amount: null }), buildRow("r2", { amount: undefined })],
            fields: { amount: buildField() },
          },
        ],
      })
    );
    expect(result.current.invalidCellsByRow.has("r1")).toBe(true);
    expect(result.current.invalidCellsByRow.has("r2")).toBe(true);
  });

  it("treats whitespace-only strings as empty", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("r1", { amount: "   " })],
            fields: { amount: buildField() },
          },
        ],
      })
    );
    expect(result.current.hasInvalidSelection).toBe(true);
  });

  it("accepts non-empty values, including 0 and false", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [
              buildRow("r1", { amount: 0 }),
              buildRow("r2", { amount: false }),
              buildRow("r3", { amount: "10" }),
            ],
            fields: { amount: buildField() },
          },
        ],
      })
    );
    expect(result.current.hasInvalidSelection).toBe(false);
  });

  it("ignores fields that are not mandatory", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("r1", { amount: "" })],
            fields: { amount: buildField({ isMandatory: false }) },
          },
        ],
      })
    );
    expect(result.current.hasInvalidSelection).toBe(false);
  });

  it("ignores fields that are not updatable (read-only display)", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("r1", { amount: "" })],
            fields: { amount: buildField({ isUpdatable: false }) },
          },
        ],
      })
    );
    expect(result.current.hasInvalidSelection).toBe(false);
  });

  it("ignores fields that are hidden (displayed=false)", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("r1", { amount: "" })],
            fields: { amount: buildField({ displayed: false }) },
          },
        ],
      })
    );
    expect(result.current.hasInvalidSelection).toBe(false);
  });

  it("flags multiple rows independently and tracks all invalid cells per row", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [
              buildRow("r1", { amount: "" }),
              buildRow("r2", { amount: 5, qty: "" }),
              buildRow("r3", { amount: 10, qty: 2 }),
            ],
            fields: {
              amount: buildField({ hqlName: "amount" }),
              qty: buildField({ hqlName: "qty", name: "Quantity" }),
            },
          },
        ],
      })
    );
    expect(result.current.invalidCellsByRow.get("r1")?.has("amount")).toBe(true);
    expect(result.current.invalidCellsByRow.get("r2")?.has("qty")).toBe(true);
    expect(result.current.invalidCellsByRow.has("r3")).toBe(false);
  });
});

describe("useGridRowValidation (multi-grid, Add Payment-shape)", () => {
  it("aggregates invalid cells across grids", () => {
    const grids = [
      {
        selectedRows: [buildRow("orderRow", { amount: "" })],
        fields: { amount: buildField({ hqlName: "amount" }) },
      },
      {
        selectedRows: [buildRow("creditRow", { paymentAmount: 0, status: "" })],
        fields: {
          paymentAmount: buildField({ hqlName: "paymentAmount" }),
          status: buildField({ hqlName: "status", name: "Status" }),
        },
      },
    ];
    const { result } = renderHook(() => useGridRowValidation({ grids }));
    expect(result.current.hasInvalidSelection).toBe(true);
    expect(result.current.invalidCellsByRow.get("orderRow")?.has("amount")).toBe(true);
    expect(result.current.invalidCellsByRow.get("creditRow")?.has("status")).toBe(true);
    expect(result.current.invalidCellsByRow.get("creditRow")?.has("paymentAmount")).toBe(false);
  });

  it("reports valid when all grids have valid selections (or no selection)", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("r1", { amount: 100 })],
            fields: { amount: buildField() },
          },
          { selectedRows: [], fields: { qty: buildField({ hqlName: "qty" }) } },
        ],
      })
    );
    expect(result.current.hasInvalidSelection).toBe(false);
  });

  it("returns a stable result when no grids are provided", () => {
    const { result } = renderHook(() => useGridRowValidation({ grids: [] }));
    expect(result.current.hasInvalidSelection).toBe(false);
    expect(result.current.invalidCellsByRow.size).toBe(0);
  });
});
