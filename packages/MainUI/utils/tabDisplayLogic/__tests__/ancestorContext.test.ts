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

import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { buildEvaluationContext } from "@/utils/evaluation/buildEvaluationContext";
import { logger } from "@/utils/logger";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import {
  type AncestorSnapshot,
  buildTabDisplayLogicOptions,
  isTabDisplayed,
  overlayLiveValues,
  toAncestorSnapshot,
} from "../ancestorContext";

jest.mock("@/utils/logger", () => ({ logger: { error: jest.fn() } }));
jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: jest.fn(jest.requireActual("@/components/Form/FormView/selectors/BaseSelector").compileExpression),
}));

const WINDOW_ID = "143";
const RECORD = { id: "L1", lineNo: 10, active: true };

const createTab = (id: string, fields: Record<string, Field> = {}, displayLogic?: string): Tab =>
  ({ id, name: id, window: WINDOW_ID, fields, displayLogic }) as unknown as Tab;

const createField = (hqlName: string, columnName: string): Field =>
  ({ hqlName, columnName, column: { dBColumnName: columnName } }) as unknown as Field;

describe("overlayLiveValues", () => {
  it("returns the record as-is without live values", () => {
    expect(overlayLiveValues(RECORD, undefined)).toBe(RECORD);
  });

  it("returns nothing without a record", () => {
    expect(overlayLiveValues(undefined, { recordId: "L1", values: { lineNo: 20 } })).toBeUndefined();
  });

  it("ignores live values of another record", () => {
    expect(overlayLiveValues(RECORD, { recordId: "L2", values: { lineNo: 20 } })).toBe(RECORD);
  });

  it("overlays the defined live values of the same record", () => {
    expect(overlayLiveValues(RECORD, { recordId: "L1", values: { lineNo: 20, active: undefined } })).toEqual({
      ...RECORD,
      lineNo: 20,
    });
  });
});

describe("toAncestorSnapshot", () => {
  const tab = createTab("lines");

  it("takes the context computed for the selected record", () => {
    const snapshot = toAncestorSnapshot(tab, RECORD, undefined, { recordId: "L1", values: { PRODUCTTYPE: "S" } });

    expect(snapshot).toEqual({ tab, values: RECORD, auxiliaryInputs: { PRODUCTTYPE: "S" } });
  });

  it("drops the context computed for another record", () => {
    const snapshot = toAncestorSnapshot(tab, RECORD, undefined, { recordId: "L2", values: { PRODUCTTYPE: "S" } });

    expect(snapshot.auxiliaryInputs).toBeUndefined();
  });
});

describe("buildTabDisplayLogicOptions", () => {
  const productTab = createTab("product", { isPriceRuleBased: createField("isPriceRuleBased", "Ispricerulebased") });
  const categoryTab = createTab("category", { name: createField("name", "Name") });
  const snapshots: AncestorSnapshot[] = [
    { tab: categoryTab, values: { id: "C1", name: "Soft Drinks" }, auxiliaryInputs: { SHARED: "parent" } },
    {
      tab: productTab,
      values: { id: "P1", isPriceRuleBased: true, name: "Service" },
      auxiliaryInputs: { SHARED: "root", ROOTONLY: "Y" },
    },
  ];

  it("puts the direct parent first and merges the other ancestors below it", () => {
    const options = buildTabDisplayLogicOptions(snapshots, { "#AD_Org_ID": "0" }, WINDOW_ID);

    expect(options).toEqual({
      values: snapshots[0].values,
      fields: categoryTab.fields,
      parentValues: snapshots[1].values,
      parentFields: productTab.fields,
      auxiliaryInputs: { SHARED: "parent", ROOTONLY: "Y" },
      context: { "#AD_Org_ID": "0" },
      windowId: WINDOW_ID,
      resolveUnprefixedPreferences: true,
    });
  });

  it("lets the closest ancestor win in the resulting context", () => {
    const context = buildEvaluationContext(buildTabDisplayLogicOptions(snapshots, {}, WINDOW_ID));

    expect(context.Name).toBe("Soft Drinks");
    expect(context.Ispricerulebased).toBe("Y");
    expect(context.SHARED).toBe("parent");
  });

  it("builds options without values for a tab with no ancestors", () => {
    const options = buildTabDisplayLogicOptions([], {}, WINDOW_ID);

    expect(options.values).toBeUndefined();
    expect(options.parentValues).toEqual({});
  });
});

describe("isTabDisplayed", () => {
  const context = buildEvaluationContext({ values: { PRODUCTTYPE: "S" } });

  it("shows a tab without display logic", () => {
    expect(isTabDisplayed(createTab("free"), context, false)).toBe(true);
  });

  it.each([
    ["S", true],
    ["I", false],
  ])("evaluates the display logic against the context (%s)", (productType, expected) => {
    expect(isTabDisplayed(createTab("related", {}, `@PRODUCTTYPE@='${productType}'`), context, false)).toBe(expected);
  });

  it.each([true, false])("returns the fallback %s and logs when the expression fails", (fallback) => {
    jest.mocked(compileExpression).mockReturnValueOnce(() => {
      throw new Error("evaluation failed");
    });

    expect(isTabDisplayed(createTab("broken", {}, "@A@='Y'"), context, fallback)).toBe(fallback);
    expect(logger.error).toHaveBeenCalled();
  });
});
