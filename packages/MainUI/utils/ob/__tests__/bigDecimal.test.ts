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

import { BigDecimal } from "../bigDecimal";

describe("BigDecimal", () => {
  it("constructs from a string, number or another BigDecimal", () => {
    expect(new BigDecimal("12.34").toString()).toBe("12.34");
    expect(new BigDecimal(12.34).toString()).toBe("12.34");
    expect(new BigDecimal(new BigDecimal("12.34")).toString()).toBe("12.34");
  });

  it("exposes ZERO on the prototype (classic `BigDecimal.prototype.ZERO` idiom)", () => {
    expect(BigDecimal.prototype.ZERO.toNumber()).toBe(0);
    expect(BigDecimal.prototype.ZERO).toBeInstanceOf(BigDecimal);
  });

  it("adds without mutating the operands", () => {
    const a = new BigDecimal("10.50");
    const b = new BigDecimal("0.25");
    const sum = a.add(b);
    expect(sum.toString()).toBe("10.75");
    expect(a.toString()).toBe("10.5");
    expect(b.toString()).toBe("0.25");
  });

  it("subtracts without mutating the operands", () => {
    const a = new BigDecimal("10.50");
    const b = new BigDecimal("0.25");
    const diff = a.subtract(b);
    expect(diff.toString()).toBe("10.25");
    expect(a.toString()).toBe("10.5");
  });

  it("keeps decimal precision where Number would drift", () => {
    expect(new BigDecimal("0.1").add(new BigDecimal("0.2")).toString()).toBe("0.3");
  });

  it("compareTo returns -1, 0 or 1", () => {
    expect(new BigDecimal("1").compareTo(new BigDecimal("2"))).toBe(-1);
    expect(new BigDecimal("2").compareTo(new BigDecimal("2"))).toBe(0);
    expect(new BigDecimal("3").compareTo(new BigDecimal("2"))).toBe(1);
  });

  it("converts to a native number", () => {
    expect(new BigDecimal("1234.56").toNumber()).toBe(1234.56);
  });

  it("setScale fixes the scale, zero-padding toString (classic `setScale(2)`)", () => {
    expect(new BigDecimal("5").setScale(2).toString()).toBe("5.00");
    expect(new BigDecimal("5.5").setScale(2).toString()).toBe("5.50");
    expect(new BigDecimal("100").setScale(2).toString()).toBe("100.00");
  });

  it("setScale does not mutate the operand", () => {
    const a = new BigDecimal("5");
    a.setScale(2);
    expect(a.toString()).toBe("5");
  });

  it("multiplies exactly without mutating the operands (classic `multiply`)", () => {
    const a = new BigDecimal("12.5");
    const b = new BigDecimal("4");
    const product = a.multiply(b);
    expect(product.toString()).toBe("50");
    expect(a.toString()).toBe("12.5");
    expect(b.toString()).toBe("4");
  });

  it("multiply keeps decimal precision where Number would drift", () => {
    expect(new BigDecimal("0.1").multiply(new BigDecimal("0.2")).toString()).toBe("0.02");
  });

  it("supports the classic `unitPrice.multiply(qty).setScale(2, ROUND_HALF_UP)` idiom", () => {
    const amount = new BigDecimal("10.005").multiply(new BigDecimal("3")).setScale(2, BigDecimal.prototype.ROUND_HALF_UP);
    expect(amount.toString()).toBe("30.02");
  });

  it("exposes ROUND_HALF_UP on the prototype (classic `BigDecimal.prototype.ROUND_HALF_UP` idiom)", () => {
    expect(typeof BigDecimal.prototype.ROUND_HALF_UP).toBe("number");
  });

  it("setScale defaults to the same rounding when no mode is passed (back-compat)", () => {
    expect(new BigDecimal("1.005").setScale(2).toString()).toBe(
      new BigDecimal("1.005").setScale(2, BigDecimal.prototype.ROUND_HALF_UP).toString()
    );
  });

  it("compareTo ignores the fixed scale", () => {
    expect(new BigDecimal("0").setScale(2).compareTo(new BigDecimal("0"))).toBe(0);
    expect(new BigDecimal("5.00").setScale(2).compareTo(new BigDecimal("5"))).toBe(0);
  });

  // Reproduces the Find-Transactions-to-Match onProcess decision: accumulate
  // Σ(depositAmount − paymentAmount) over the selection and compare to the line amount.
  it("matches the classic split-decision arithmetic", () => {
    const selection = [
      { depositAmount: "100.00", paymentAmount: "0.00" },
      { depositAmount: "0.00", paymentAmount: "30.00" },
    ];
    let total = BigDecimal.prototype.ZERO;
    for (const trx of selection) {
      total = total.add(new BigDecimal(trx.depositAmount).subtract(new BigDecimal(trx.paymentAmount)));
    }

    // Net is 70.00 → equals the line amount: no split confirmation required.
    expect(total.compareTo(new BigDecimal("70")) === 0).toBe(true);
    // Net differs from a larger line amount: split confirmation required.
    expect(total.compareTo(new BigDecimal("99.99")) !== 0).toBe(true);
  });

  // Reproduces REM `CalculateSelected`: accumulate signed amounts per currency
  // (`.add(...).setScale(2)`), drop currencies that net to zero, and render `"<total> <iso>"`.
  it("matches the REM per-currency accumulation", () => {
    const records = [
      { amount: 100, receipt: true, currency: "EUR" },
      { amount: 30, receipt: false, currency: "EUR" },
      { amount: 50, receipt: true, currency: "USD" },
      { amount: 50, receipt: false, currency: "USD" },
    ];
    const totals: Record<string, BigDecimal> = {};
    for (const record of records) {
      const signedAmount = record.receipt ? record.amount : -record.amount;
      const current = totals[record.currency] ?? new BigDecimal("0");
      const next = current.add(new BigDecimal(signedAmount.toString())).setScale(2);
      if (next.compareTo(new BigDecimal("0")) === 0) {
        delete totals[record.currency];
      } else {
        totals[record.currency] = next;
      }
    }

    let total = "";
    for (const iso of Object.keys(totals)) {
      total += `${totals[iso].toString()} ${iso} `;
    }

    // EUR nets to 70.00 (kept, scaled); USD nets to 0 (dropped).
    expect(total).toBe("70.00 EUR ");
  });
});
