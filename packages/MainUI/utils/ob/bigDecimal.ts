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

import BigNumber from "bignumber.js";

/** A value `new BigDecimal(...)` accepts (the classic scripts pass `String(...)`). */
type BigDecimalValue = BigNumber.Value | BigDecimal;

/** Unwraps a {@link BigDecimal} to its backing {@link BigNumber}, leaving raw values as-is. */
function toBigNumber(value: BigDecimalValue): BigNumber.Value {
  return value instanceof BigDecimal ? value.value : value;
}

/**
 * Minimal, immutable port of the classic global `BigDecimal` (the GWT/Java decimal type bundled by
 * Openbravo's `bigdecimal.js`), backed by `bignumber.js`. Injected as a process-script global so
 * migrated hooks can do decimal amount arithmetic with the exact rounding/scale parity the
 * server-side check expects — never with lossy `Number`.
 *
 * Only the surface the in-scope migrated processes use is implemented. `multiply`/`divide` are
 * intentionally omitted: Java `BigDecimal.divide` requires an explicit scale + `RoundingMode` to be
 * deterministic, so they will be added (with those semantics) when a process actually needs them.
 */
export class BigDecimal {
  /** Backing arbitrary-precision value. */
  readonly value: BigNumber;

  /** Zero, exposed on the prototype to honour the classic `BigDecimal.prototype.ZERO` idiom. */
  declare ZERO: BigDecimal;

  constructor(value: BigDecimalValue) {
    this.value = new BigNumber(toBigNumber(value));
  }

  /** Returns a new `BigDecimal` equal to `this + other`. */
  add(other: BigDecimalValue): BigDecimal {
    return new BigDecimal(this.value.plus(toBigNumber(other)));
  }

  /** Returns a new `BigDecimal` equal to `this - other`. */
  subtract(other: BigDecimalValue): BigDecimal {
    return new BigDecimal(this.value.minus(toBigNumber(other)));
  }

  /**
   * Returns `-1`, `0` or `1` as `this` is less than, equal to, or greater than `other`. Decimal
   * operands are never NaN, so `comparedTo`'s `null` (a NaN operand) is surfaced as `NaN`.
   */
  compareTo(other: BigDecimalValue): number {
    return this.value.comparedTo(toBigNumber(other)) ?? Number.NaN;
  }

  /** Canonical decimal string. */
  toString(): string {
    return this.value.toString();
  }

  /** Native number conversion (for formatting helpers such as `JSToOBMasked`). */
  toNumber(): number {
    return this.value.toNumber();
  }
}

BigDecimal.prototype.ZERO = new BigDecimal(0);
