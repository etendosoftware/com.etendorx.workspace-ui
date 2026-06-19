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
 * Only the surface the in-scope migrated processes use is implemented. `divide` follows the Java
 * `BigDecimal.divide(divisor, scale, RoundingMode)` contract: it requires an explicit scale +
 * rounding mode so the quotient is deterministic (a bare `a / b` could be non-terminating).
 */
export class BigDecimal {
  /** Backing arbitrary-precision value. */
  readonly value: BigNumber;

  /**
   * Fixed decimal scale, when set via {@link setScale}. Mirrors Java/classic `BigDecimal` scale:
   * `toString` then renders exactly this many decimals (zero-padded). `undefined` means the natural,
   * unpadded representation. `add`/`subtract` results carry no scale (the classic code re-applies
   * `setScale` after operating), so this stays `undefined` unless `setScale` set it.
   */
  readonly scale?: number;

  /** Zero, exposed on the prototype to honour the classic `BigDecimal.prototype.ZERO` idiom. */
  declare ZERO: BigDecimal;

  /** One, exposed on the prototype to honour the classic `BigDecimal.prototype.ONE` idiom. */
  declare ONE: BigDecimal;

  /**
   * Half-up rounding mode, exposed on the prototype to honour the classic
   * `BigDecimal.prototype.ROUND_HALF_UP` idiom (passed as the 2nd arg of `setScale`).
   */
  declare ROUND_HALF_UP: number;

  constructor(value: BigDecimalValue, scale?: number) {
    this.value = new BigNumber(toBigNumber(value));
    this.scale = scale;
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
   * Returns a new `BigDecimal` equal to `this * other`. Java `BigDecimal.multiply` is exact (the
   * product scale is the sum of the operand scales, with no rounding), so this carries no fixed
   * scale — callers re-apply `setScale` afterwards, exactly as the classic scripts do.
   */
  multiply(other: BigDecimalValue): BigDecimal {
    return new BigDecimal(this.value.multipliedBy(toBigNumber(other)));
  }

  /**
   * Returns `-1`, `0` or `1` as `this` is less than, equal to, or greater than `other`. Decimal
   * operands are never NaN, so `comparedTo`'s `null` (a NaN operand) is surfaced as `NaN`.
   */
  compareTo(other: BigDecimalValue): number {
    return this.value.comparedTo(toBigNumber(other)) ?? Number.NaN;
  }

  /**
   * Returns a new `BigDecimal` equal to `this / divisor`, rounded to `scale` decimals with the given
   * rounding mode and a fixed scale, mirroring Java `BigDecimal.divide(divisor, scale, RoundingMode)`
   * (classic `amount.divide(rate, precision, BigDecimal.prototype.ROUND_HALF_UP)`). The explicit
   * scale + mode keep the quotient deterministic even when the exact division does not terminate.
   */
  divide(divisor: BigDecimalValue, scale: number, roundingMode: number = BigNumber.ROUND_HALF_UP): BigDecimal {
    const quotient = this.value
      .dividedBy(toBigNumber(divisor))
      .decimalPlaces(scale, roundingMode as BigNumber.RoundingMode);
    return new BigDecimal(quotient, scale);
  }

  /** Returns `-1`, `0` or `1` as `this` is negative, zero, or positive (classic Java `signum()`). */
  signum(): number {
    return this.value.comparedTo(0) ?? Number.NaN;
  }

  /** Returns a new `BigDecimal` equal to `-this` (classic Java `negate()`). */
  negate(): BigDecimal {
    return new BigDecimal(this.value.negated());
  }

  /** Returns a new `BigDecimal` equal to `|this|` (classic Java `abs()`). */
  abs(): BigDecimal {
    return new BigDecimal(this.value.absoluteValue());
  }

  /**
   * Returns a new `BigDecimal` rounded to `scale` decimals with a fixed scale, mirroring the classic
   * `BigDecimal.setScale(scale)`. Rounding uses `ROUND_HALF_UP` (the Classic money default); for the
   * ≤2-decimal money amounts these scripts handle, nothing is ever discarded, so this matches the
   * classic `ROUND_UNNECESSARY` default exactly while only ever zero-padding (e.g. `5` → `"5.00"`).
   *
   * Accepts an optional `roundingMode` (the classic `setScale(scale, BigDecimal.prototype.ROUND_HALF_UP)`
   * 2-arg form); it defaults to `ROUND_HALF_UP`, preserving the previous single-arg behaviour.
   */
  setScale(scale: number, roundingMode: number = BigNumber.ROUND_HALF_UP): BigDecimal {
    return new BigDecimal(this.value.decimalPlaces(scale, roundingMode as BigNumber.RoundingMode), scale);
  }

  /** Canonical decimal string; zero-padded to {@link scale} decimals when a scale was fixed. */
  toString(): string {
    return this.scale === undefined ? this.value.toString() : this.value.toFixed(this.scale);
  }

  /** Native number conversion (for formatting helpers such as `JSToOBMasked`). */
  toNumber(): number {
    return this.value.toNumber();
  }
}

BigDecimal.prototype.ZERO = new BigDecimal(0);
BigDecimal.prototype.ONE = new BigDecimal(1);
BigDecimal.prototype.ROUND_HALF_UP = BigNumber.ROUND_HALF_UP;
