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

import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { ColumnOnChange, ColumnValidator } from "@/utils/processes/definition/scriptProxies";
import { createEmbeddedGridController } from "../WindowReferenceGrid";

const ROWS: EntityData[] = [
  { id: "1", quantity: 2, amount: 20 } as unknown as EntityData,
  { id: "2", quantity: 5, amount: 50 } as unknown as EntityData,
];

const makeController = () => {
  const recordChangeSubs: Array<(record: EntityData, changes: Record<string, unknown>) => void> = [];
  const selectionToggleSubs: Array<(record: EntityData, state: boolean) => void> = [];
  const columnOnChange = new Map<string, ColumnOnChange>();
  const columnValidator = new Map<string, ColumnValidator>();
  const controller = createEmbeddedGridController(
    () =>
      ({
        rows: ROWS,
        refetch: jest.fn(),
        criteria: undefined,
        fields: [{ columnName: "quantity", hqlName: "quantity", inputName: "inpquantity" }],
        handleRowSelection: jest.fn(),
        handleClearSelections: jest.fn(),
        handleRecordChange: jest.fn(),
        setRowActions: jest.fn(),
      }) as never,
    () => [ROWS[1]],
    {
      dataArrived: [],
      selectionChanged: [],
      recordChange: recordChangeSubs,
      selectionToggle: selectionToggleSubs,
      columnOnChange,
      columnValidator,
    }
  );
  return { controller, recordChangeSubs, selectionToggleSubs, columnOnChange, columnValidator };
};

describe("createEmbeddedGridController", () => {
  it("registers onRecordChange / onSelectionToggle subscribers into the shared arrays", () => {
    const { controller, recordChangeSubs, selectionToggleSubs } = makeController();
    const recordFn = jest.fn();
    const toggleFn = jest.fn();
    controller.onRecordChange(recordFn);
    controller.onSelectionToggle(toggleFn);
    expect(recordChangeSubs).toContain(recordFn);
    expect(selectionToggleSubs).toContain(toggleFn);
  });

  it("does not register the same subscriber twice", () => {
    const { controller, recordChangeSubs } = makeController();
    const fn = jest.fn();
    controller.onRecordChange(fn);
    controller.onRecordChange(fn);
    expect(recordChangeSubs.filter((f) => f === fn)).toHaveLength(1);
  });

  it("registers per-column onChange / validator into the shared maps", () => {
    const { controller, columnOnChange, columnValidator } = makeController();
    const onChange = jest.fn();
    const validator = jest.fn(() => true);
    controller.setColumnOnChange("quantity", onChange);
    controller.setColumnValidator("quantity", validator);
    expect(columnOnChange.get("quantity")).toBe(onChange);
    expect(columnValidator.get("quantity")).toBe(validator);
  });

  it("getEditedCell accepts a row index and a column name", () => {
    const { controller } = makeController();
    expect(controller.getEditedCell(0, "amount")).toBe(20);
    expect(controller.getEditedCell(1, "quantity")).toBe(5);
  });

  it("getEditedCell tolerates a record and a field object (classic shape)", () => {
    const { controller } = makeController();
    const record = ROWS[1];
    const fieldObject = { columnName: "amount" };
    expect(controller.getEditedCell(record, fieldObject)).toBe(50);
    // hqlName / inputName variants resolve too.
    expect(controller.getEditedCell(0, { hqlName: "quantity" })).toBe(2);
    expect(controller.getEditedCell(0, { inputName: "amount" })).toBe(20);
  });
});
