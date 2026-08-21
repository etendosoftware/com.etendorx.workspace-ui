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

import {
  PASSWORD_ERROR_TRANSLATION_KEYS,
  resolvePasswordErrorMessage,
  submitNewPassword,
  submitPasswordChange,
  validateNewPassword,
  validatePasswordChange,
} from "../password";

const REQUIRED_KEY = "navigation.profile.passwordRequired";
const MISMATCH_KEY = "navigation.profile.passwordMismatch";
const GENERIC_KEY = "navigation.profile.errorGeneric";
const VALID_PASSWORD = "Str0ng-P4ss!";
const ERP_CATALOG = {
  ETAS_PasswordAlreadyUsed: "Password has been used already. Try another",
  CPPasswordNotStrongEnough: "Passwords must have at least 8 characters",
};

/** Resolvers mimicking the backend catalog (identity fallback) and the local translations (echo). */
const resolvers = {
  getLabel: (code: string) => ERP_CATALOG[code as keyof typeof ERP_CATALOG] ?? code,
  t: (key: string) => key,
} as Parameters<typeof resolvePasswordErrorMessage>[1];

describe("utils/password", () => {
  describe("resolvePasswordErrorMessage", () => {
    it("returns an empty string when there is no error", () => {
      expect(resolvePasswordErrorMessage(null, resolvers)).toBe("");
    });

    it("translates a validation error with the local key", () => {
      expect(resolvePasswordErrorMessage({ type: "validation", translationKey: MISMATCH_KEY }, resolvers)).toBe(
        MISMATCH_KEY
      );
    });

    it("prefers the ERP catalog for a code the backend defines", () => {
      expect(resolvePasswordErrorMessage({ type: "erp", messageCode: "ETAS_PasswordAlreadyUsed" }, resolvers)).toBe(
        ERP_CATALOG.ETAS_PasswordAlreadyUsed
      );
    });

    it("falls back to the local translation when the catalog does not resolve the code", () => {
      expect(resolvePasswordErrorMessage({ type: "erp", messageCode: "UINAVBA_UnequalPwd" }, resolvers)).toBe(
        PASSWORD_ERROR_TRANSLATION_KEYS.UINAVBA_UnequalPwd
      );
    });

    it.each(["", "SomeUnknownCode", "HTTP error! status: 500"])(
      "falls back to the generic message for %p",
      (messageCode) => {
        expect(resolvePasswordErrorMessage({ type: "erp", messageCode }, resolvers)).toBe(GENERIC_KEY);
      }
    );

    it("falls back to the local translation when the catalog is empty", () => {
      const emptyCatalog = { getLabel: (code: string) => code, t: (key: string) => key } as typeof resolvers;

      expect(resolvePasswordErrorMessage({ type: "erp", messageCode: "CPDifferentPassword" }, emptyCatalog)).toBe(
        PASSWORD_ERROR_TRANSLATION_KEYS.CPDifferentPassword
      );
    });
  });

  describe("validateNewPassword", () => {
    it("requires the new password", () => {
      expect(validateNewPassword({ newPwd: "", confirmPwd: VALID_PASSWORD })?.translationKey).toBe(REQUIRED_KEY);
    });

    it("requires the confirmation", () => {
      expect(validateNewPassword({ newPwd: VALID_PASSWORD, confirmPwd: "" })?.translationKey).toBe(REQUIRED_KEY);
    });

    it("rejects a confirmation that does not match", () => {
      expect(validateNewPassword({ newPwd: VALID_PASSWORD, confirmPwd: "other" })?.translationKey).toBe(MISMATCH_KEY);
    });

    it("accepts a matching pair", () => {
      expect(validateNewPassword({ newPwd: VALID_PASSWORD, confirmPwd: VALID_PASSWORD })).toBeNull();
    });
  });

  describe("validatePasswordChange", () => {
    it("requires the current password", () => {
      expect(
        validatePasswordChange({ currentPwd: "", newPwd: VALID_PASSWORD, confirmPwd: VALID_PASSWORD })?.translationKey
      ).toBe(REQUIRED_KEY);
    });

    it("delegates the new/confirm rules", () => {
      expect(
        validatePasswordChange({ currentPwd: "old", newPwd: VALID_PASSWORD, confirmPwd: "other" })?.translationKey
      ).toBe(MISMATCH_KEY);
      expect(validatePasswordChange({ currentPwd: "old", newPwd: "", confirmPwd: "" })?.translationKey).toBe(
        REQUIRED_KEY
      );
    });

    it("accepts all three fields when valid", () => {
      expect(
        validatePasswordChange({ currentPwd: "old", newPwd: VALID_PASSWORD, confirmPwd: VALID_PASSWORD })
      ).toBeNull();
    });
  });

  describe("submitNewPassword", () => {
    const validFields = { newPwd: VALID_PASSWORD, confirmPwd: VALID_PASSWORD };

    it("returns null and forwards the fields when the change succeeds", async () => {
      const submit = jest.fn().mockResolvedValue(undefined);

      await expect(submitNewPassword(validFields, submit)).resolves.toBeNull();
      expect(submit).toHaveBeenCalledWith(validFields);
    });

    it("returns the validation error without submitting", async () => {
      const submit = jest.fn();

      await expect(submitNewPassword({ newPwd: VALID_PASSWORD, confirmPwd: "other" }, submit)).resolves.toEqual({
        type: "validation",
        translationKey: MISMATCH_KEY,
      });
      expect(submit).not.toHaveBeenCalled();
    });

    it("returns the ERP message code reported by a rejection", async () => {
      const submit = jest.fn().mockRejectedValue(new Error("ETAS_PasswordAlreadyUsed"));

      await expect(submitNewPassword(validFields, submit)).resolves.toEqual({
        type: "erp",
        messageCode: "ETAS_PasswordAlreadyUsed",
      });
    });

    it("returns an empty code for a non-Error rejection", async () => {
      const submit = jest.fn().mockRejectedValue("boom");

      await expect(submitNewPassword(validFields, submit)).resolves.toEqual({ type: "erp", messageCode: "" });
    });
  });

  describe("submitPasswordChange", () => {
    const validFields = { currentPwd: "old", newPwd: VALID_PASSWORD, confirmPwd: VALID_PASSWORD };

    it("returns null and forwards the fields when the change succeeds", async () => {
      const submit = jest.fn().mockResolvedValue(undefined);

      await expect(submitPasswordChange(validFields, submit)).resolves.toBeNull();
      expect(submit).toHaveBeenCalledWith(validFields);
    });

    it("returns the validation error without submitting", async () => {
      const submit = jest.fn();

      await expect(submitPasswordChange({ ...validFields, currentPwd: "" }, submit)).resolves.toEqual({
        type: "validation",
        translationKey: REQUIRED_KEY,
      });
      expect(submit).not.toHaveBeenCalled();
    });

    it("returns the ERP message code reported by a rejection", async () => {
      const submit = jest.fn().mockRejectedValue(new Error("UINAVBA_CurrentPwdIncorrect"));

      await expect(submitPasswordChange(validFields, submit)).resolves.toEqual({
        type: "erp",
        messageCode: "UINAVBA_CurrentPwdIncorrect",
      });
    });
  });
});
