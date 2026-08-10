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

/**
 * Local translations for ERP message codes, used only as a fallback: the ERP message catalog
 * (`AD_MESSAGE`, served by `/meta/labels`) is the primary source, matching what Classic does with
 * `OB.I18N.getLabel(field.messageCode)`. Codes without an `AD_MESSAGE` entry still render here.
 */
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

/** A rule broken client-side, before the request is sent. */
interface ValidationError {
  type: "validation";
  translationKey: TranslationKeys;
}

/** A message code reported by the ERP change-password handler. */
interface ErpError {
  type: "erp";
  messageCode: string;
}

export type PasswordChangeError = ValidationError | ErpError;

/** Resolvers needed to turn an error into user-facing text. */
export interface PasswordErrorResolvers {
  /** Resolves an ERP message code against the backend catalog; returns the code when unknown. */
  getLabel: (code: string) => string;
  /** Resolves a local translation key. */
  t: (key: TranslationKeys) => string;
}

/**
 * Turns a message code reported by the ERP into user-facing text, preferring the backend message
 * catalog and falling back to the local translations for codes it does not define.
 *
 * @param messageCode the code reported by the ERP
 * @param resolvers the backend catalog and local translation resolvers
 * @returns the text to display
 */
function resolveErpMessage(messageCode: string, { getLabel, t }: PasswordErrorResolvers): string {
  const label = getLabel(messageCode);
  if (label && label !== messageCode) {
    return label;
  }
  return t(PASSWORD_ERROR_TRANSLATION_KEYS[messageCode] ?? GENERIC_ERROR_KEY);
}

/**
 * Turns a password change error into the message to display.
 *
 * @param error the error to render, or null when there is none
 * @param resolvers the backend catalog and local translation resolvers
 * @returns the text to display, or an empty string when there is no error
 */
export function resolvePasswordErrorMessage(
  error: PasswordChangeError | null,
  resolvers: PasswordErrorResolvers
): string {
  if (!error) {
    return "";
  }
  if (error.type === "validation") {
    return resolvers.t(error.translationKey);
  }
  return resolveErpMessage(error.messageCode, resolvers);
}

/**
 * Validates the new/confirm pair before hitting the backend.
 *
 * @param fields the new password and its confirmation
 * @returns the first violated rule, or null when the pair is valid
 */
export function validateNewPassword({ newPwd, confirmPwd }: NewPasswordFields): ValidationError | null {
  if (!newPwd || !confirmPwd) {
    return { type: "validation", translationKey: REQUIRED_FIELDS_KEY };
  }
  if (newPwd !== confirmPwd) {
    return { type: "validation", translationKey: MISMATCH_KEY };
  }
  return null;
}

/**
 * Validates the three fields of the optional password change.
 *
 * @param fields the current password plus the new password and its confirmation
 * @returns the first violated rule, or null when all fields are valid
 */
export function validatePasswordChange({
  currentPwd,
  newPwd,
  confirmPwd,
}: PasswordChangeFields): ValidationError | null {
  if (!currentPwd) {
    return { type: "validation", translationKey: REQUIRED_FIELDS_KEY };
  }
  return validateNewPassword({ newPwd, confirmPwd });
}

/**
 * Runs a change request, turning a rejection into the ERP message code it reported.
 *
 * @param submit the request to run
 * @returns null when the change succeeded, or the reported error
 */
async function runSubmit(submit: () => Promise<void>): Promise<PasswordChangeError | null> {
  try {
    await submit();
    return null;
  } catch (error) {
    return { type: "erp", messageCode: error instanceof Error ? error.message : "" };
  }
}

/**
 * Validates and submits the mandatory change forced when the password has expired, where the current
 * password is supplied by the session rather than typed by the user.
 *
 * @param fields the new password and its confirmation
 * @param submit the request that applies the change
 * @returns null when the change succeeded, or the error to display
 */
export async function submitNewPassword(
  fields: NewPasswordFields,
  submit: (fields: NewPasswordFields) => Promise<void>
): Promise<PasswordChangeError | null> {
  const validationError = validateNewPassword(fields);
  if (validationError) {
    return validationError;
  }
  return runSubmit(() => submit(fields));
}

/**
 * Validates and submits the optional change from the profile modal, where the user also provides
 * their current password.
 *
 * @param fields the current password plus the new password and its confirmation
 * @param submit the request that applies the change
 * @returns null when the change succeeded, or the error to display
 */
export async function submitPasswordChange(
  fields: PasswordChangeFields,
  submit: (fields: PasswordChangeFields) => Promise<void>
): Promise<PasswordChangeError | null> {
  const validationError = validatePasswordChange(fields);
  if (validationError) {
    return validationError;
  }
  return runSubmit(() => submit(fields));
}
