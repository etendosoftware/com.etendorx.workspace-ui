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

/**
 * CT-AD-3: Multi-grid P&E — Add Payment-shape (3 Window Reference params).
 *
 * - Each grid stores its selection under a separate dBColumnName key in gridSelection.
 * - Selecting rows in grid-1 must not affect grid-2 or grid-3.
 * - The final payload carries `_selection` independently per grid parameter.
 */

import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { GridSelectionStructure } from "../ProcessDefinitionModal";
import { useGridRowValidation } from "../hooks/useGridRowValidation";

const buildRow = (id: string, data: Record<string, unknown> = {}): EntityData =>
  ({ id, ...data }) as unknown as EntityData;

// Simulates the multi-key gridSelection state that ProcessDefinitionModal maintains.
// Each key is the dBColumnName of one Window Reference parameter.
const useMultiGridSelection = () => {
  const [gridSelection, setGridSelection] = useState<GridSelectionStructure>({});

  const selectInGrid = (gridKey: string, rows: EntityData[]) => {
    setGridSelection((prev) => ({
      ...prev,
      [gridKey]: {
        _selection: rows,
        _allRows: rows,
      },
    }));
  };

  return { gridSelection, selectInGrid };
};

describe("Multi-grid selection isolation (CT-AD-3)", () => {
  it("selecting rows in grid-1 does not affect grid-2 or grid-3 keys", () => {
    const { result } = renderHook(() => useMultiGridSelection());

    act(() => {
      result.current.selectInGrid("C_Order_ID", [buildRow("order1")]);
    });

    expect(result.current.gridSelection["C_Order_ID"]?._selection).toHaveLength(1);
    expect(result.current.gridSelection["C_Credit_ID"]).toBeUndefined();
    expect(result.current.gridSelection["C_GLItem_ID"]).toBeUndefined();
  });

  it("selecting rows in grid-2 does not overwrite grid-1 selection", () => {
    const { result } = renderHook(() => useMultiGridSelection());

    act(() => {
      result.current.selectInGrid("C_Order_ID", [buildRow("order1"), buildRow("order2")]);
    });
    act(() => {
      result.current.selectInGrid("C_Credit_ID", [buildRow("credit1")]);
    });

    expect(result.current.gridSelection["C_Order_ID"]?._selection).toHaveLength(2);
    expect(result.current.gridSelection["C_Credit_ID"]?._selection).toHaveLength(1);
    expect(result.current.gridSelection["C_GLItem_ID"]).toBeUndefined();
  });

  it("three independent grids each track their own selection", () => {
    const { result } = renderHook(() => useMultiGridSelection());

    act(() => {
      result.current.selectInGrid("C_Order_ID", [buildRow("o1")]);
      result.current.selectInGrid("C_Credit_ID", [buildRow("c1"), buildRow("c2")]);
      result.current.selectInGrid("C_GLItem_ID", []);
    });

    expect(result.current.gridSelection["C_Order_ID"]?._selection).toHaveLength(1);
    expect(result.current.gridSelection["C_Credit_ID"]?._selection).toHaveLength(2);
    expect(result.current.gridSelection["C_GLItem_ID"]?._selection).toHaveLength(0);
  });

  it("clearing one grid does not affect the others", () => {
    const { result } = renderHook(() => useMultiGridSelection());

    act(() => {
      result.current.selectInGrid("C_Order_ID", [buildRow("o1")]);
      result.current.selectInGrid("C_Credit_ID", [buildRow("c1")]);
    });
    act(() => {
      result.current.selectInGrid("C_Order_ID", []);
    });

    expect(result.current.gridSelection["C_Order_ID"]?._selection).toHaveLength(0);
    expect(result.current.gridSelection["C_Credit_ID"]?._selection).toHaveLength(1);
  });
});

describe("Multi-grid validation (CT-AD-3 + useGridRowValidation)", () => {
  it("identifies invalid cells across all 3 grids independently", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("o1", { amount: "" })],
            fields: {
              amount: {
                hqlName: "amount",
                isMandatory: true,
                isUpdatable: true,
                displayed: true,
              } as any,
            },
          },
          {
            selectedRows: [buildRow("c1", { paymentAmount: 50 })],
            fields: {
              paymentAmount: {
                hqlName: "paymentAmount",
                isMandatory: true,
                isUpdatable: true,
                displayed: true,
              } as any,
            },
          },
          {
            selectedRows: [],
            fields: {
              glAmount: {
                hqlName: "glAmount",
                isMandatory: true,
                isUpdatable: true,
                displayed: true,
              } as any,
            },
          },
        ],
      })
    );

    // grid-1: invalid (amount empty)
    expect(result.current.invalidCellsByRow.get("o1")?.has("amount")).toBe(true);
    // grid-2: valid (paymentAmount = 50)
    expect(result.current.invalidCellsByRow.has("c1")).toBe(false);
    // grid-3: no selection → not validated
    expect(result.current.hasInvalidSelection).toBe(true);
  });

  it("reports valid when all grids have non-empty mandatory cells or no selection", () => {
    const { result } = renderHook(() =>
      useGridRowValidation({
        grids: [
          {
            selectedRows: [buildRow("o1", { amount: 100 })],
            fields: {
              amount: {
                hqlName: "amount",
                isMandatory: true,
                isUpdatable: true,
                displayed: true,
              } as any,
            },
          },
          {
            selectedRows: [buildRow("c1", { paymentAmount: 75 })],
            fields: {
              paymentAmount: {
                hqlName: "paymentAmount",
                isMandatory: true,
                isUpdatable: true,
                displayed: true,
              } as any,
            },
          },
          { selectedRows: [], fields: undefined },
        ],
      })
    );

    expect(result.current.hasInvalidSelection).toBe(false);
    expect(result.current.invalidCellsByRow.size).toBe(0);
  });
});
