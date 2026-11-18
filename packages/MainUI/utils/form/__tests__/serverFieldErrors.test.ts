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

import type { Field } from "@workspaceui/api-client/src/api/types";
import {
  extractServerFieldErrors,
  hasServerFieldErrors,
  indexFieldsByHqlName,
  joinServerFieldErrors,
  labelServerFieldErrors,
  toFieldErrorMessage,
} from "../serverFieldErrors";

const REFERENCE_NO = "referenceNo";
const REFERENCE_NO_LABEL = "Reference No.";
const TOO_LONG = "BusinessPartner.referenceNo: Value too long. Length 50, maximum allowed 40";
const TOO_LONG_LABELLED = "BusinessPartner.Reference No.: Value too long. Length 50, maximum allowed 40";
const INVALID_DATE = "Invalid date";

const makeField = (hqlName: string, name: string) => ({ hqlName, name }) as unknown as Field;
const FIELDS: Record<string, Field> = {
  [REFERENCE_NO]: makeField(REFERENCE_NO, REFERENCE_NO_LABEL),
  accountingDate: makeField("accountingDate", "Accounting Date"),
};

describe("serverFieldErrors", () => {
  describe("extractServerFieldErrors", () => {
    it("returns the text messages of the errors map", () => {
      expect(extractServerFieldErrors({ status: -4, errors: { [REFERENCE_NO]: TOO_LONG } })).toEqual({
        [REFERENCE_NO]: TOO_LONG,
      });
    });

    it("skips empty and non-text messages", () => {
      const response = { errors: { [REFERENCE_NO]: "", id: { errorMessage: "x" }, name: 3 } };
      expect(extractServerFieldErrors(response)).toEqual({});
    });

    it.each([
      ["no response", undefined],
      ["no errors map", { status: -1, error: { message: "Boom" } }],
      ["a non-object errors value", { errors: "Boom" }],
    ])("returns no errors with %s", (_case, response) => {
      expect(extractServerFieldErrors(response as Record<string, unknown> | undefined)).toEqual({});
    });
  });

  it("indexes the fields by hqlName", () => {
    expect(indexFieldsByHqlName(FIELDS).get(REFERENCE_NO)?.name).toBe(REFERENCE_NO_LABEL);
    expect(indexFieldsByHqlName(undefined).size).toBe(0);
  });

  describe("toFieldErrorMessage", () => {
    it("replaces the property name with the field label", () => {
      expect(toFieldErrorMessage(REFERENCE_NO, TOO_LONG, REFERENCE_NO_LABEL)).toBe(TOO_LONG_LABELLED);
    });

    it("keeps the message without a label", () => {
      expect(toFieldErrorMessage(REFERENCE_NO, TOO_LONG)).toBe(TOO_LONG);
    });

    it("inserts labels with replacement patterns literally", () => {
      expect(toFieldErrorMessage("amt", "amt is wrong", "Amount $&")).toBe("Amount $& is wrong");
    });
  });

  it("labels the messages of the known fields only", () => {
    expect(labelServerFieldErrors({ [REFERENCE_NO]: TOO_LONG, unknown: "unknown failed" }, FIELDS)).toEqual({
      [REFERENCE_NO]: TOO_LONG_LABELLED,
      unknown: "unknown failed",
    });
  });

  describe("joinServerFieldErrors", () => {
    it("keeps messages that name the field and prefixes the others", () => {
      const errors = { [REFERENCE_NO]: TOO_LONG_LABELLED, accountingDate: INVALID_DATE, other: INVALID_DATE };
      expect(joinServerFieldErrors(errors, FIELDS)).toBe(
        `${TOO_LONG_LABELLED}; Accounting Date: ${INVALID_DATE}; other: ${INVALID_DATE}`
      );
    });
  });

  it("tells whether there are errors", () => {
    expect(hasServerFieldErrors({})).toBe(false);
    expect(hasServerFieldErrors({ [REFERENCE_NO]: TOO_LONG })).toBe(true);
  });
});
