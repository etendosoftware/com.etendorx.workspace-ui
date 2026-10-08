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

import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { buildEvaluationContext } from "../buildEvaluationContext";

describe("buildEvaluationContext", () => {
  beforeEach(() => installLocalStorageMock());

  it("overwrites session keys that share a name with a record value, ignoring case and underscores", () => {
    const ctx = buildEvaluationContext({
      context: { PRODUCTTYPE: "OLD", product_type: "OLD", Other: "keep" },
      values: { productType: "I" },
    });
    expect(ctx.PRODUCTTYPE).toBe("I");
    expect(ctx.product_type).toBe("I");
    expect(ctx.Other).toBe("keep");
  });

  it("never overwrites a non-empty value with an empty one", () => {
    const ctx = buildEvaluationContext({ context: { PRODUCTTYPE: "S" }, values: { productType: "" } });
    expect(ctx.PRODUCTTYPE).toBe("S");
  });

  it("does not let a key match keys written after it", () => {
    const ctx = buildEvaluationContext({ values: { productType: "A", PRODUCT_TYPE: "B" } });
    // PRODUCT_TYPE (second) overwrites productType (first); the first never sees the second.
    expect(ctx.productType).toBe("B");
  });

  it("resolves reads case-insensitively first, then ignoring underscores", () => {
    const ctx = buildEvaluationContext({ values: { docStatus: "CO", doc_status_x: "N" } });
    expect(ctx.DOCSTATUS).toBe("CO");
    expect(ctx.docstatusx).toBe("N");
    expect("DOCSTATUS" in ctx).toBe(true);
  });

  it("sees writes made through the proxy after creation", () => {
    const ctx = buildEvaluationContext({ values: { a: "1" } });
    ctx.NewKey = "x";
    expect(ctx.newkey).toBe("x");
    Reflect.deleteProperty(ctx, "NewKey"); // through the deleteProperty trap; Biome rejects `delete`
    expect(ctx.newkey).toBe("");
  });

  it("does not record __proto__ as a key", () => {
    const ctx = buildEvaluationContext({
      values: Object.fromEntries([
        ["__proto__", "x"],
        ["a", "1"],
      ]),
    });
    expect(Object.keys(ctx)).not.toContain("__proto__");
  });
});
