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
});
