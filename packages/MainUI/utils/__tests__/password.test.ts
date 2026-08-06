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
  getPasswordErrorTranslationKey,
  submitNewPassword,
  submitPasswordChange,
  validateNewPassword,
  validatePasswordChange,
} from "../password";

const REQUIRED_KEY = "navigation.profile.passwordRequired";
const MISMATCH_KEY = "navigation.profile.passwordMismatch";
const GENERIC_KEY = "navigation.profile.errorGeneric";
const VALID_PASSWORD = "Str0ng-P4ss!";

describe("utils/password", () => {
  describe("getPasswordErrorTranslationKey", () => {
    it.each(Object.entries(PASSWORD_ERROR_TRANSLATION_KEYS))("maps the ERP code %s", (code, expectedKey) => {
      expect(getPasswordErrorTranslationKey(code)).toBe(expectedKey);
    });

    it.each(["", "SomeUnknownCode", "HTTP error! status: 500"])("falls back to the generic key for %p", (code) => {
      expect(getPasswordErrorTranslationKey(code)).toBe(GENERIC_KEY);
    });
  });

  describe("validateNewPassword", () => {
    it("requires the new password", () => {
      expect(validateNewPassword({ newPwd: "", confirmPwd: VALID_PASSWORD })).toBe(REQUIRED_KEY);
    });

    it("requires the confirmation", () => {
      expect(validateNewPassword({ newPwd: VALID_PASSWORD, confirmPwd: "" })).toBe(REQUIRED_KEY);
    });

    it("rejects a confirmation that does not match", () => {
      expect(validateNewPassword({ newPwd: VALID_PASSWORD, confirmPwd: "other" })).toBe(MISMATCH_KEY);
    });

    it("accepts a matching pair", () => {
      expect(validateNewPassword({ newPwd: VALID_PASSWORD, confirmPwd: VALID_PASSWORD })).toBeNull();
    });
  });

  describe("validatePasswordChange", () => {
    it("requires the current password", () => {
      expect(validatePasswordChange({ currentPwd: "", newPwd: VALID_PASSWORD, confirmPwd: VALID_PASSWORD })).toBe(
        REQUIRED_KEY
      );
    });

    it("delegates the new/confirm rules", () => {
      expect(validatePasswordChange({ currentPwd: "old", newPwd: VALID_PASSWORD, confirmPwd: "other" })).toBe(
        MISMATCH_KEY
      );
      expect(validatePasswordChange({ currentPwd: "old", newPwd: "", confirmPwd: "" })).toBe(REQUIRED_KEY);
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

    it("returns the validation key without submitting", async () => {
      const submit = jest.fn();

      await expect(submitNewPassword({ newPwd: VALID_PASSWORD, confirmPwd: "other" }, submit)).resolves.toBe(
        MISMATCH_KEY
      );
      expect(submit).not.toHaveBeenCalled();
    });

    it("maps a rejection to its translation key", async () => {
      const submit = jest.fn().mockRejectedValue(new Error("CPPasswordNotStrongEnough"));

      await expect(submitNewPassword(validFields, submit)).resolves.toBe(
        PASSWORD_ERROR_TRANSLATION_KEYS.CPPasswordNotStrongEnough
      );
    });

    it("maps a non-Error rejection to the generic key", async () => {
      const submit = jest.fn().mockRejectedValue("boom");

      await expect(submitNewPassword(validFields, submit)).resolves.toBe(GENERIC_KEY);
    });
  });

  describe("submitPasswordChange", () => {
    const validFields = { currentPwd: "old", newPwd: VALID_PASSWORD, confirmPwd: VALID_PASSWORD };

    it("returns null and forwards the fields when the change succeeds", async () => {
      const submit = jest.fn().mockResolvedValue(undefined);

      await expect(submitPasswordChange(validFields, submit)).resolves.toBeNull();
      expect(submit).toHaveBeenCalledWith(validFields);
    });

    it("returns the validation key without submitting", async () => {
      const submit = jest.fn();

      await expect(submitPasswordChange({ ...validFields, currentPwd: "" }, submit)).resolves.toBe(REQUIRED_KEY);
      expect(submit).not.toHaveBeenCalled();
    });

    it("maps a rejection to its translation key", async () => {
      const submit = jest.fn().mockRejectedValue(new Error("UINAVBA_CurrentPwdIncorrect"));

      await expect(submitPasswordChange(validFields, submit)).resolves.toBe(
        PASSWORD_ERROR_TRANSLATION_KEYS.UINAVBA_CurrentPwdIncorrect
      );
    });
  });
});
