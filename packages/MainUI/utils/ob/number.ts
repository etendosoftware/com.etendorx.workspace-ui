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

import { DEFAULT_GROUPING_SIZE, DEFAULT_NUMERIC_MASK } from "./format";

/** Decimals implied by a numeric mask's fractional pattern. */
interface MaskFractionDigits {
  min: number;
  max: number;
}

/**
 * Derives the min/max fraction digits from a mask such as `#,##0.00` (min=max=2)
 * or `#,##0.0##` (min=1, max=3). Pattern uses `.` as the fractional delimiter.
 */
function parseMaskFractionDigits(mask: string): MaskFractionDigits {
  const decimalIndex = mask.lastIndexOf(".");
  if (decimalIndex === -1) {
    return { min: 0, max: 0 };
  }
  const fractionPattern = mask.substring(decimalIndex + 1);
  const min = (fractionPattern.match(/0/g) ?? []).length;
  const max = (fractionPattern.match(/[0#]/g) ?? []).length;
  return { min, max };
}

/** Drops trailing zeros from a fixed fraction string, keeping at least `min`. */
function trimFraction(fraction: string, min: number): string {
  let end = fraction.length;
  while (end > min && fraction[end - 1] === "0") {
    end--;
  }
  return fraction.substring(0, end);
}

/** Inserts the grouping separator every `interval` digits from the right. */
function groupIntegerDigits(integerDigits: string, separator: string, interval: number): string {
  if (!interval || interval <= 0) {
    return integerDigits;
  }
  let grouped = "";
  let count = 0;
  for (let i = integerDigits.length - 1; i >= 0; i--) {
    grouped = integerDigits[i] + grouped;
    count++;
    if (count % interval === 0 && i !== 0) {
      grouped = separator + grouped;
    }
  }
  return grouped;
}

/**
 * Formats a JavaScript number into an Etendo-masked string, applying the given
 * decimal/grouping separators and the decimals implied by `mask`.
 *
 * Simplified port of classic `OB.Utilities.Number.JSToOBMasked`. The in-scope
 * migrated processes only ever pass `OB.Format.defaultNumericMask` (a standard
 * `#,##0.00`-style mask), which this implementation reproduces exactly; masks
 * with literal symbols are out of scope. Non-numeric input is returned
 * unchanged, matching classic behaviour.
 */
export function JSToOBMasked(
  value: unknown,
  mask: string = DEFAULT_NUMERIC_MASK,
  decSeparator = ".",
  groupSeparator = ",",
  groupInterval: number = DEFAULT_GROUPING_SIZE
): unknown {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return value;
  }
  const { min, max } = parseMaskFractionDigits(mask);
  const fixed = Math.abs(value).toFixed(max);
  const [integerPart, fractionPart = ""] = fixed.split(".");
  const trimmedFraction = trimFraction(fractionPart, min);
  const groupedInteger = groupIntegerDigits(integerPart, groupSeparator, groupInterval);
  const sign = value < 0 ? "-" : "";
  return trimmedFraction ? `${sign}${groupedInteger}${decSeparator}${trimmedFraction}` : `${sign}${groupedInteger}`;
}
