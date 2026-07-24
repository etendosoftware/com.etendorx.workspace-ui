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
 * @fileoverview Unit tests for isMandatoryParameterMissing.
 *
 * The helper decides whether a mandatory process parameter still blocks the
 * Execute button. The central case is the reported bug: a mandatory parameter
 * hidden by its display logic must NOT be required, so the button can enable once
 * the parameter is hidden again.
 */

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { isMandatoryParameterMissing } from "../isMandatoryParameterMissing";

const FIELD_NAME = "Business Partner Category";
const DB_COLUMN_NAME = "C_BP_Category_Id";

const makeParam = (overrides: Partial<ProcessParameter> = {}): ProcessParameter =>
  ({
    id: "F6E1CF1EBA9C4001ADB70B97DC84BE6E",
    name: FIELD_NAME,
    dBColumnName: DB_COLUMN_NAME,
    mandatory: true,
    defaultValue: null as unknown as string,
    reference: "95E2A8B50A254B2AAE6774B8C2F28120",
    refList: [],
    ...overrides,
  }) as ProcessParameter;

const alwaysVisible = () => true;
const alwaysHidden = () => false;

describe("isMandatoryParameterMissing", () => {
  it("returns false for a non-mandatory parameter", () => {
    const parameter = makeParam({ mandatory: false });

    expect(
      isMandatoryParameterMissing({ parameter, formValues: { [FIELD_NAME]: "" }, isDisplayed: alwaysVisible })
    ).toBe(false);
  });

  it("returns false when the parameter is inactive", () => {
    const parameter = makeParam({ active: false } as Partial<ProcessParameter>);

    expect(
      isMandatoryParameterMissing({ parameter, formValues: { [FIELD_NAME]: "" }, isDisplayed: alwaysVisible })
    ).toBe(false);
  });

  it("returns false when the parameter has a default value", () => {
    const parameter = makeParam({ defaultValue: "someDefault" });

    expect(
      isMandatoryParameterMissing({ parameter, formValues: { [FIELD_NAME]: "" }, isDisplayed: alwaysVisible })
    ).toBe(false);
  });

  it("returns false when the parameter is not registered in the form values", () => {
    const parameter = makeParam();

    expect(isMandatoryParameterMissing({ parameter, formValues: {}, isDisplayed: alwaysVisible })).toBe(false);
  });

  it("returns true when mandatory, visible, registered and empty", () => {
    const parameter = makeParam();

    expect(
      isMandatoryParameterMissing({ parameter, formValues: { [FIELD_NAME]: "" }, isDisplayed: alwaysVisible })
    ).toBe(true);
  });

  it("returns false when mandatory and empty but hidden (the reported bug)", () => {
    const parameter = makeParam();

    expect(
      isMandatoryParameterMissing({ parameter, formValues: { [FIELD_NAME]: "" }, isDisplayed: alwaysHidden })
    ).toBe(false);
  });

  it("returns false when mandatory, visible and filled", () => {
    const parameter = makeParam();

    expect(
      isMandatoryParameterMissing({ parameter, formValues: { [FIELD_NAME]: "cat-1" }, isDisplayed: alwaysVisible })
    ).toBe(false);
  });

  it("falls back to the dBColumnName value when the name value is undefined", () => {
    const parameter = makeParam();
    const formValues = { [FIELD_NAME]: undefined, [DB_COLUMN_NAME]: "cat-1" };

    expect(isMandatoryParameterMissing({ parameter, formValues, isDisplayed: alwaysVisible })).toBe(false);
  });

  it("treats an empty array as missing but a non-empty array as present", () => {
    const parameter = makeParam();

    expect(
      isMandatoryParameterMissing({ parameter, formValues: { [FIELD_NAME]: [] }, isDisplayed: alwaysVisible })
    ).toBe(true);
    expect(
      isMandatoryParameterMissing({ parameter, formValues: { [FIELD_NAME]: ["x"] }, isDisplayed: alwaysVisible })
    ).toBe(false);
  });
});
