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

const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGIT_CHARS = "0123456789";
const SPECIAL_CHARS = "!@#$%^&*()+=-[]\\';,./{}|\":<>?~_";

/**
 * Builds the character pool from the allow-flags, matching classic defaults:
 * lowercase and uppercase are included unless explicitly `false`; digits and
 * special characters are excluded unless explicitly `true`.
 */
function buildCharacterPool(
  allowLowerCaseChars: boolean,
  allowUpperCaseChars: boolean,
  allowDigits: boolean,
  allowSpecialChars: boolean
): string {
  let chars = "";
  if (allowLowerCaseChars !== false) chars += LOWERCASE_CHARS;
  if (allowUpperCaseChars !== false) chars += UPPERCASE_CHARS;
  if (allowDigits === true) chars += DIGIT_CHARS;
  if (allowSpecialChars === true) chars += SPECIAL_CHARS;
  return chars;
}

/**
 * Direct port of classic `OB.Utilities.generateRandomString`. Generates a
 * pseudo-random string of `stringLength` characters from the selected pools.
 * Returns an empty string when no pool is enabled.
 */
export function generateRandomString(
  stringLength: number,
  allowLowerCaseChars = true,
  allowUpperCaseChars = true,
  allowDigits = false,
  allowSpecialChars = false
): string {
  const length = Number.parseInt(String(stringLength), 10) || 1;
  const chars = buildCharacterPool(allowLowerCaseChars, allowUpperCaseChars, allowDigits, allowSpecialChars);
  if (chars === "") {
    return "";
  }
  let result = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * chars.length);
    result += chars.charAt(index);
  }
  return result;
}
