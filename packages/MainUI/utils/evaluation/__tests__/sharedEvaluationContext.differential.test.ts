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
import { getEvaluationContext } from "../sharedEvaluationContext";
import {
  expectSameContext,
  genOptions,
  genRecord,
  mulberry32,
  pick,
  type Rnd,
  VALUES,
} from "../__mocks__/differentialHarness";

/** The context each caller used to build for itself. */
const fresh = (options: EvaluationContextOptions, overlay: Record<string, unknown>) =>
  buildEvaluationContext({ ...options, values: { ...options.values, ...overlay } });

/**
 * An overlay like the dependency values a field reads: keys of the record with the same value, keys of
 * the record with another value, keys the record does not have, undefined and object values.
 */
const genOverlay = (rnd: Rnd, record: Record<string, unknown>): Record<string, unknown> => {
  const keys = Object.keys(record);
  const entries: Array<[string, unknown]> = [];
  const size = Math.floor(rnd() * 6);
  for (let i = 0; i < size; i++) {
    const roll = rnd();
    if (roll < 0.45 && keys.length > 0) {
      const key = pick(rnd, keys);
      entries.push([key, record[key]]);
    } else if (roll < 0.7 && keys.length > 0) {
      entries.push([pick(rnd, keys), pick(rnd, VALUES)]);
    } else {
      const extra = genRecord(rnd, 1, "dep");
      entries.push(...Object.entries(extra));
    }
  }
  return Object.fromEntries(entries);
};

describe("getEvaluationContext — same context as building it per caller", () => {
  beforeEach(() => {
    installLocalStorageMock();
    savePreferences({ productType: "PREF", productType_W1: "PREF_W1", DocStatus: true, isSOTrx: "" });
  });

  it.each([1, 2, 3])("matches a fresh build on realistic-size data (seed %i)", (seed) => {
    const rnd = mulberry32(seed);
    const options = genOptions(rnd, { session: 70, record: 180, aux: 15, parent: 30 });
    for (let i = 0; i < 40; i++) {
      const overlay = genOverlay(rnd, options.values ?? {});
      expectSameContext(getEvaluationContext(options, overlay), fresh(options, overlay));
    }
  });

  it("matches a fresh build on 300 random small inputs, with repeated (shared) calls", () => {
    for (let seed = 100; seed < 400; seed++) {
      const rnd = mulberry32(seed);
      const options = genOptions(rnd, { session: 20, record: 15, aux: 5, parent: 6 });
      for (let i = 0; i < 6; i++) {
        const overlay = genOverlay(rnd, options.values ?? {});
        // Twice: the second call is served from the cache
        getEvaluationContext(options, overlay);
        expectSameContext(getEvaluationContext(options, overlay), fresh(options, overlay));
      }
    }
  });

  it("matches a fresh build without a record", () => {
    const options: EvaluationContextOptions = { context: { "#AD_Org_ID": "0" }, windowId: "W1" };
    for (const overlay of [{}, { docStatus: "DR" }, { docStatus: undefined }]) {
      expectSameContext(getEvaluationContext(options, overlay), fresh(options, overlay));
    }
  });

  it("returns the record's context when the overlay only repeats record values", () => {
    const options: EvaluationContextOptions = { values: { docStatus: "DR", processed: false, total: 5 } };
    const base = getEvaluationContext(options);
    expect(getEvaluationContext(options, { docStatus: "DR" })).toBe(base);
    expect(getEvaluationContext(options, { processed: false, total: 5 })).toBe(base);
    expect(getEvaluationContext(options, { docStatus: "CO" })).not.toBe(base);
  });

  it("shares a context between equal primitive overlays, in the same key order only", () => {
    const options: EvaluationContextOptions = { values: { docStatus: "DR" } };
    const first = getEvaluationContext(options, { docStatus: "CO", extra: 1 });
    expect(getEvaluationContext(options, { docStatus: "CO", extra: 1 })).toBe(first);

    const a = getEvaluationContext(options, { newA: "1", newB: "2" });
    const b = getEvaluationContext(options, { newB: "2", newA: "1" });
    expect(a).not.toBe(b);
    expectSameContext(b, fresh(options, { newB: "2", newA: "1" }));
  });

  it("never shares a context built from object values", () => {
    const options: EvaluationContextOptions = { values: { docStatus: "DR" } };
    const entries = ["A"];
    expect(getEvaluationContext(options, { list: entries })).not.toBe(getEvaluationContext(options, { list: entries }));
  });

  it("does not share across different inputs", () => {
    const record = { docStatus: "DR" };
    const session = { "#AD_Org_ID": "0" };
    const ctx = getEvaluationContext({ values: record, context: session });
    expect(getEvaluationContext({ values: record, context: { ...session } })).not.toBe(ctx);
    expect(getEvaluationContext({ values: { ...record }, context: session })).not.toBe(ctx);
    expect(getEvaluationContext({ values: record, context: session, windowId: "W1" })).not.toBe(ctx);
  });

  it("drops a shared context as soon as a caller writes to it", () => {
    const options: EvaluationContextOptions = { values: { docStatus: "DR" } };
    const written = getEvaluationContext(options);
    written.docStatus = "VO";
    written.extraKey = "x";

    const next = getEvaluationContext(options);
    expect(next).not.toBe(written);
    expect(next.docStatus).toBe("DR");
    expect(next.extraKey).toBe("");
    expectSameContext(next, fresh(options, {}));

    const overlay = { docStatus: "CO" };
    const writtenOverlay = getEvaluationContext(options, overlay);
    Reflect.deleteProperty(writtenOverlay, "docStatus");
    expect(getEvaluationContext(options, overlay)).not.toBe(writtenOverlay);
    expectSameContext(getEvaluationContext(options, overlay), fresh(options, overlay));
  });
});
