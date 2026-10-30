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

import { PRE_SUBMIT_OUTCOME, resolvePreSubmitOutcome } from "../preSubmitOutcome";

const ERROR = "error";

describe("resolvePreSubmitOutcome", () => {
  it("is submitted when the script called executeProcess, whatever it returned", () => {
    expect(resolvePreSubmitOutcome({ executed: true, msgType: ERROR, msgText: "Failed" })).toBe(
      PRE_SUBMIT_OUTCOME.SUBMITTED
    );
  });

  it("aborts on an error with text", () => {
    expect(resolvePreSubmitOutcome({ executed: false, msgType: ERROR, msgText: "Select a record" })).toBe(
      PRE_SUBMIT_OUTCOME.ABORT
    );
  });

  it.each([undefined, ""])("aborts silently on an error without text (%p)", (msgText) => {
    expect(resolvePreSubmitOutcome({ executed: false, msgType: ERROR, msgText })).toBe(
      PRE_SUBMIT_OUTCOME.ABORT_SILENTLY
    );
  });

  it.each([undefined, "success", "warning"])("proceeds for a %p result", (msgType) => {
    expect(resolvePreSubmitOutcome({ executed: false, msgType })).toBe(PRE_SUBMIT_OUTCOME.PROCEED);
  });
});
