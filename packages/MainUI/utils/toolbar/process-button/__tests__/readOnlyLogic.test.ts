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

import { buildEvaluationContext } from "@/utils/evaluation/buildEvaluationContext";
import { logger } from "@/utils/logger";
import { collectReadOnlyButtonIds, isProcessButtonReadOnly } from "../readOnlyLogic";

const PROCESSED_LOGIC = "OB.Utilities.getValue(currentValues,'processed') === 'Y'";
const WINDOW_ID = "W1";

const contextForRecord = (record: Record<string, unknown>) => buildEvaluationContext({ values: record });
const button = (id: string, readOnlyLogicExpression?: string) => ({ id, columnName: id, readOnlyLogicExpression });
const records = (...processed: unknown[]) => processed.map((value, index) => ({ id: `R${index}`, processed: value }));

describe("isProcessButtonReadOnly", () => {
  it("is false for a button without read-only logic", () => {
    expect(isProcessButtonReadOnly(button("F1"), records("Y"), contextForRecord, WINDOW_ID)).toBe(false);
  });

  it.each([
    ["Y", true],
    ["N", false],
    [true, true],
    [false, false],
  ])("follows the logic for processed = %s", (processed, expected) => {
    expect(isProcessButtonReadOnly(button("F1", PROCESSED_LOGIC), records(processed), contextForRecord)).toBe(expected);
  });

  it("is true when the logic is true for any selected record", () => {
    expect(isProcessButtonReadOnly(button("F1", PROCESSED_LOGIC), records("N", "Y"), contextForRecord)).toBe(true);
  });

  it("is false when the logic is false for every selected record", () => {
    expect(isProcessButtonReadOnly(button("F1", PROCESSED_LOGIC), records("N", "N"), contextForRecord)).toBe(false);
  });

  it("is true and logs a warning when the logic cannot be evaluated", () => {
    const warn = jest.spyOn(logger, "warn").mockImplementation(() => undefined);
    const failingContext = () => {
      throw new Error("no context");
    };
    expect(isProcessButtonReadOnly(button("F1", PROCESSED_LOGIC), records("N"), failingContext)).toBe(true);
    expect(warn).toHaveBeenCalledWith("Error evaluating readOnlyLogic for F1:", expect.any(Error));
    warn.mockRestore();
  });
});

describe("collectReadOnlyButtonIds", () => {
  it("collects only the buttons whose read-only logic is true", () => {
    const buttons = [button("F1", PROCESSED_LOGIC), button("F2"), button("F3", "true")];
    expect(collectReadOnlyButtonIds(buttons, records("N"), contextForRecord, WINDOW_ID)).toEqual(new Set(["F3"]));
  });
});
