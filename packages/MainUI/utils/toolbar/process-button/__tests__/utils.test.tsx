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

import { buttonNeedsContext, isProcessButtonAccessible, isProcessButtonEnabled } from "../utils";

describe("isProcessButtonAccessible", () => {
  it("is false only when the metadata flags the process as not accessible", () => {
    expect(isProcessButtonAccessible({ isProcessAccessible: false })).toBe(false);
  });

  it.each([true, undefined])("is true when the flag is %s", (isProcessAccessible) => {
    expect(isProcessButtonAccessible({ isProcessAccessible })).toBe(true);
  });
});

describe("buttonNeedsContext", () => {
  const CONTEXT_LOGIC = "context.AD_ROLE_ID !== '0'";
  const RECORD_LOGIC = "OB.Utilities.getValue(currentValues,'processed') === 'Y'";

  it.each([
    ["the display logic", { displayLogicExpression: CONTEXT_LOGIC }],
    ["the read-only logic", { readOnlyLogicExpression: CONTEXT_LOGIC }],
  ])("is true when %s reads the context", (_, button) => {
    expect(buttonNeedsContext(button)).toBe(true);
  });

  it.each([
    ["no logic", {}],
    ["logic on record values", { displayLogicExpression: RECORD_LOGIC, readOnlyLogicExpression: RECORD_LOGIC }],
  ])("is false with %s", (_, button) => {
    expect(buttonNeedsContext(button)).toBe(false);
  });
});

describe("isProcessButtonEnabled", () => {
  const READ_ONLY_IDS = new Set(["F1"]);

  it.each([
    ["accessible and not read-only", { id: "F2" }, READ_ONLY_IDS, true],
    ["accessible without read-only ids", { id: "F1" }, undefined, true],
    ["read-only", { id: "F1" }, READ_ONLY_IDS, false],
    ["not accessible", { id: "F2", isProcessAccessible: false }, READ_ONLY_IDS, false],
  ])("is %s → %s", (_, button, readOnlyIds, expected) => {
    expect(isProcessButtonEnabled(button, readOnlyIds)).toBe(expected);
  });
});
