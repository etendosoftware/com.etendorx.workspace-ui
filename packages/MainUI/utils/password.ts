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
 * Shared validation and error-mapping helpers for the password change flows: the optional change
 * from the profile modal and the mandatory change forced at login when the password has expired.
 */

import type { TranslationKeys } from "@workspaceui/componentlibrary/src/locales/types";

/** Message codes returned by the ERP change-password action handler, mapped to translation keys. */
export const PASSWORD_ERROR_TRANSLATION_KEYS: Record<string, TranslationKeys> = {
  UINAVBA_CurrentPwdIncorrect: "navigation.profile.errorCurrentPwdIncorrect",
  CPDifferentPassword: "navigation.profile.errorDifferentPassword",
  UINAVBA_IncorrectPwd: "navigation.profile.errorIncorrectPwd",
  UINAVBA_UnequalPwd: "navigation.profile.errorUnequalPwd",
  CPPasswordNotStrongEnough: "navigation.profile.errorNotStrongEnough",
};

const GENERIC_ERROR_KEY: TranslationKeys = "navigation.profile.errorGeneric";
const REQUIRED_FIELDS_KEY: TranslationKeys = "navigation.profile.passwordRequired";
const MISMATCH_KEY: TranslationKeys = "navigation.profile.passwordMismatch";

interface NewPasswordFields {
  newPwd: string;
  confirmPwd: string;
}

interface PasswordChangeFields extends NewPasswordFields {
  currentPwd: string;
}

/**
 * Resolves the translation key for an ERP message code, falling back to a generic message for
 * unknown codes and transport failures.
 *
 * @param code the message code thrown by the change-password request
 * @returns the translation key to render
 */
export function getPasswordErrorTranslationKey(code: string): TranslationKeys {
  return PASSWORD_ERROR_TRANSLATION_KEYS[code] ?? GENERIC_ERROR_KEY;
}

/**
 * Validates the new/confirm pair before hitting the backend.
 *
 * @param fields the new password and its confirmation
 * @returns the translation key of the first violated rule, or null when the pair is valid
 */
export function validateNewPassword({ newPwd, confirmPwd }: NewPasswordFields): TranslationKeys | null {
  if (!newPwd || !confirmPwd) {
    return REQUIRED_FIELDS_KEY;
  }
  if (newPwd !== confirmPwd) {
    return MISMATCH_KEY;
  }
  return null;
}

/**
 * Validates the three fields of the optional password change.
 *
 * @param fields the current password plus the new password and its confirmation
 * @returns the translation key of the first violated rule, or null when all fields are valid
 */
export function validatePasswordChange({
  currentPwd,
  newPwd,
  confirmPwd,
}: PasswordChangeFields): TranslationKeys | null {
  if (!currentPwd) {
    return REQUIRED_FIELDS_KEY;
  }
  return validateNewPassword({ newPwd, confirmPwd });
}

/**
 * Runs a change request, translating a rejection into the translation key to display.
 *
 * @param submit the request to run
 * @returns null when the change succeeded, or the translation key of the reported error
 */
async function runSubmit(submit: () => Promise<void>): Promise<TranslationKeys | null> {
  try {
    await submit();
    return null;
  } catch (error) {
    return getPasswordErrorTranslationKey(error instanceof Error ? error.message : "");
  }
}

/**
 * Validates and submits the mandatory change forced when the password has expired, where the current
 * password is supplied by the session rather than typed by the user.
 *
 * @param fields the new password and its confirmation
 * @param submit the request that applies the change
 * @returns null when the change succeeded, or the translation key of the error to display
 */
export async function submitNewPassword(
  fields: NewPasswordFields,
  submit: (fields: NewPasswordFields) => Promise<void>
): Promise<TranslationKeys | null> {
  const validationKey = validateNewPassword(fields);
  if (validationKey) {
    return validationKey;
  }
  return runSubmit(() => submit(fields));
}

/**
 * Validates and submits the optional change from the profile modal, where the user also provides
 * their current password.
 *
 * @param fields the current password plus the new password and its confirmation
 * @param submit the request that applies the change
 * @returns null when the change succeeded, or the translation key of the error to display
 */
export async function submitPasswordChange(
  fields: PasswordChangeFields,
  submit: (fields: PasswordChangeFields) => Promise<void>
): Promise<TranslationKeys | null> {
  const validationKey = validatePasswordChange(fields);
  if (validationKey) {
    return validationKey;
  }
  return runSubmit(() => submit(fields));
}
