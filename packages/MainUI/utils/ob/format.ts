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

import type { OBFormat } from "./types";

/** Fallbacks used when the locale cannot be resolved. */
const FALLBACK_DECIMAL_SYMBOL = ".";
const FALLBACK_GROUPING_SYMBOL = ",";
const FALLBACK_LOCALE = "en-US";

/** Default grouping size (thousands) — locale-independent in classic. */
export const DEFAULT_GROUPING_SIZE = 3;

/**
 * Default numeric mask. Classic injects this from the backend; in the new UI
 * the migrated processes only ever pass `OB.Format.defaultNumericMask`, and all
 * those usages format monetary amounts, so a 2-decimal mask reproduces classic
 * display.
 */
export const DEFAULT_NUMERIC_MASK = "#,##0.00";

/** Converts an Etendo language code (`en_US`) to a BCP-47 locale (`en-US`). */
function toLocale(language?: string | null): string {
  return language ? language.replace("_", "-") : FALLBACK_LOCALE;
}

/** Reads a separator of the given part type from the locale's number format. */
function readSeparator(locale: string, type: "decimal" | "group", fallback: string): string {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    return parts.find((part) => part.type === type)?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Builds the `OB.Format` namespace, deriving the decimal and grouping symbols
 * from the current language via `Intl.NumberFormat`.
 */
export function createFormat(language?: string | null): OBFormat {
  const locale = toLocale(language);
  return {
    defaultDecimalSymbol: readSeparator(locale, "decimal", FALLBACK_DECIMAL_SYMBOL),
    defaultGroupingSymbol: readSeparator(locale, "group", FALLBACK_GROUPING_SYMBOL),
    defaultGroupingSize: DEFAULT_GROUPING_SIZE,
    defaultNumericMask: DEFAULT_NUMERIC_MASK,
  };
}
