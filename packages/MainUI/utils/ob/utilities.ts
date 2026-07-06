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
 * Picks `count` indices in `[0, max)` using a CSPRNG when available. This is exposed to
 * Application Dictionary scripts as `OB.Utilities.generateRandomString`, and callers may
 * use it for anything from display codes to temporary passwords, so it must not rely on
 * a statistically predictable source of randomness.
 */
function randomIndices(count: number, max: number): number[] {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buffer = new Uint32Array(count);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (v) => v % max);
  }
  return Array.from({ length: count }, () => Math.floor(Math.random() * max)); // NOSONAR typescript:S2245
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
  return randomIndices(length, chars.length)
    .map((index) => chars.charAt(index))
    .join("");
}
