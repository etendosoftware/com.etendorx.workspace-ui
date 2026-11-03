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
 * Evaluates, with the real expression compiler, the display logic the server sends
 * for an accounting dimension parameter of Add Transaction (`ad_org_id`), where
 * `@ACCT_DIMENSION_DISPLAY@` is expanded by `DimensionDisplayUtility`.
 */

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { createProcessExpressionContext, isParameterDisplayed } from "../processExpressionUtils";

const ORG_DIMENSION = {
  name: "Organization",
  dBColumnName: "ad_org_id",
  displayLogic: "@ACCT_DIMENSION_DISPLAY@ & @trxtype@!''",
  displayLogicExpression:
    "((context.$IsAcctDimCentrally === 'N' && context.$Element_OO === 'Y') || " +
    "(context.$IsAcctDimCentrally === 'Y' && context['$Element_OO_' + " +
    'OB.Utilities.getValue(currentValues, "DOCBASETYPE") + ' +
    "'_H'] === 'Y')) && OB.Utilities.getValue(currentValues,'trxtype') !== ''",
} as unknown as ProcessParameter;

const DEPOSIT = "BPD";

/** Display decision for the given evaluation context (session keys + parameter values). */
const isShown = (context: Record<string, unknown>) =>
  isParameterDisplayed({
    parameter: ORG_DIMENSION,
    values: { trxtype: context.trxtype },
    evaluationContext: context as ReturnType<typeof createProcessExpressionContext>,
  });

describe("accounting dimension display logic (server expression)", () => {
  it("shows the dimension for a centrally maintained client with it enabled for the document", () => {
    expect(isShown({ $IsAcctDimCentrally: "Y", $Element_OO_FAT_H: "Y", DOCBASETYPE: "FAT", trxtype: DEPOSIT })).toBe(
      true
    );
  });

  it("hides it when the document type does not enable it", () => {
    expect(isShown({ $IsAcctDimCentrally: "Y", $Element_OO_FAT_H: "N", DOCBASETYPE: "FAT", trxtype: DEPOSIT })).toBe(
      false
    );
  });

  it("shows it for a client that is not centrally maintained, from the classic $Element_OO", () => {
    expect(isShown({ $IsAcctDimCentrally: "N", $Element_OO: "Y", trxtype: DEPOSIT })).toBe(true);
  });

  it("hides it until a transaction type is chosen", () => {
    expect(isShown({ $IsAcctDimCentrally: "Y", $Element_OO_FAT_H: "Y", DOCBASETYPE: "FAT", trxtype: "" })).toBe(false);
  });
});

describe("accounting dimension display logic with the modal's evaluation context", () => {
  it("resolves DOCBASETYPE from the form values and the dimension flag from the session", () => {
    const docBaseType = { name: "DOCBASETYPE", dBColumnName: "DOCBASETYPE" } as unknown as ProcessParameter;
    const trxType = { name: "Transaction Type", dBColumnName: "trxtype" } as unknown as ProcessParameter;
    const values = { DOCBASETYPE: "FAT", "Transaction Type": DEPOSIT };
    const evaluationContext = createProcessExpressionContext({
      values,
      parameters: { DOCBASETYPE: docBaseType, "Transaction Type": trxType, Organization: ORG_DIMENSION },
      recordValues: {},
      session: { $IsAcctDimCentrally: "Y", $Element_OO_FAT_H: "Y" },
    });

    expect(isParameterDisplayed({ parameter: ORG_DIMENSION, values, evaluationContext })).toBe(true);
  });
});
