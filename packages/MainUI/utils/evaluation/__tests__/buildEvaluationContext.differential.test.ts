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

import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { buildEvaluationContext, type EvaluationContextOptions } from "../buildEvaluationContext";
import { expectSameContext, genOptions, mulberry32 } from "../__mocks__/differentialHarness";
import { legacyCreateEvaluationContext } from "../__mocks__/legacyEvaluationContext";

describe("buildEvaluationContext — differential against the legacy builder", () => {
  beforeEach(() => {
    installLocalStorageMock();
    savePreferences({ productType: "PREF", productType_W1: "PREF_W1", DocStatus: true, isSOTrx: "" });
  });

  it.each([1, 2, 3])("matches the legacy builder on realistic-size data (seed %i)", (seed) => {
    const options = genOptions(mulberry32(seed), { session: 470, record: 180, aux: 20, parent: 30 });
    expectSameContext(buildEvaluationContext(options), legacyCreateEvaluationContext(options));
  });

  it("matches the legacy builder on 300 random small inputs", () => {
    for (let seed = 100; seed < 400; seed++) {
      const options = genOptions(mulberry32(seed), { session: 25, record: 15, aux: 5, parent: 6 });
      expectSameContext(buildEvaluationContext(options), legacyCreateEvaluationContext(options));
    }
  });

  it("matches the legacy builder after writes through the proxy (deterministic collision group)", () => {
    const options: EvaluationContextOptions = {
      context: { PRODUCTTYPE: "S", product_type: "T" },
      values: { productType: "I", documentNo: "1" },
    };
    const actual = buildEvaluationContext(options);
    const expected = legacyCreateEvaluationContext(options);

    // Before any write: forces a lazily built lookup index (if any) to materialize.
    expectSameContext(actual, expected);

    const collisionGroup = ["PRODUCTTYPE", "product_type", "productType"];
    for (const ctx of [actual, expected]) {
      const firstCollisionKey = Object.keys(ctx).find((k) => collisionGroup.includes(k));
      if (firstCollisionKey) Reflect.deleteProperty(ctx, firstCollisionKey);

      ctx.DOCUMENTNO_NEW = "x";
      ctx.DocumentNo = "y";
      ctx.documentNo = "";
      Object.defineProperty(ctx, "definedKey", { value: "d", enumerable: true, configurable: true, writable: true });
    }

    // After the writes: the (possibly stale) index must still agree with the legacy builder.
    expectSameContext(actual, expected);
  });

  it("matches the legacy builder after writes through the proxy (seeded random data)", () => {
    const options = genOptions(mulberry32(7), { session: 40, record: 30, aux: 6, parent: 8 });
    const actual = buildEvaluationContext(options);
    const expected = legacyCreateEvaluationContext(options);

    expectSameContext(actual, expected);

    for (const ctx of [actual, expected]) {
      ctx.extraKey = "W";
      ctx.DOCUMENTNO = "OVERRIDE";
      // Reflect.deleteProperty goes through the proxy's deleteProperty trap like `delete`
      // (which Biome's noDelete rejects in this repo).
      Reflect.deleteProperty(ctx, "AD_Org_ID");
    }

    expectSameContext(actual, expected);
  });

  it("matches the legacy builder for empty and minimal inputs", () => {
    for (const options of [{}, { context: {} }, { values: {} }, { values: { a: 1 }, normalizeValues: false }]) {
      expectSameContext(buildEvaluationContext(options), legacyCreateEvaluationContext(options));
    }
  });

  it("detects a difference (harness self-check)", () => {
    const options = { values: { isActive: true } };
    expect(() =>
      expectSameContext(
        buildEvaluationContext({ ...options, normalizeValues: false }),
        legacyCreateEvaluationContext(options)
      )
    ).toThrow();
  });

  it("detects a difference from key order (harness self-check)", () => {
    expect(() =>
      expectSameContext(
        legacyCreateEvaluationContext({ values: { a: "1", b: "2" } }),
        legacyCreateEvaluationContext({ values: { b: "2", a: "1" } })
      )
    ).toThrow();
  });
});
