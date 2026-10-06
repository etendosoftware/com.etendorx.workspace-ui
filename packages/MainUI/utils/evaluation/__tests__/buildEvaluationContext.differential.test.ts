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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { buildEvaluationContext, type EvaluationContextOptions } from "../buildEvaluationContext";
import { legacyCreateEvaluationContext } from "../__mocks__/legacyEvaluationContext";

/** Deterministic PRNG so every failure is reproducible from its seed. */
const mulberry32 = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Rnd = () => number;
const pick = <T>(rnd: Rnd, items: readonly T[]): T => items[Math.floor(rnd() * items.length)];

/** Names that collide by case and underscores, Etendo-style prefixes, integer-like and inherited names. */
const BASE_NAMES = [
  "P|Exception_ID",
  "$Element_OO",
  "AD_Client_ID",
  "AD_Org_ID",
  "C_BPartner_ID",
  "cBpartner",
  "documentNo",
  "DOCUMENTNO",
  "DocStatus",
  "docstatus",
  "isSOTrx",
  "IsSOTrx",
  "ISSOTRX",
  "productType",
  "PRODUCTTYPE",
  "product_type",
  "M_Product_ID",
  "mProduct",
  "grandTotalAmount",
  "GRAND_TOTAL_AMOUNT",
  "processed",
  "Processed",
  "_identifier",
  "0",
  "1",
  "42",
  "toString",
  "constructor",
  "valueOf",
  "__proto__",
] as const;

/**
 * Shared reference instances: both builders always receive the exact same `options` object, so a
 * value picked from here keeps its identity across `actual`/`expected` — the builder must round-trip
 * it unchanged (no cloning). A shared object assigned to a `__proto__` key changes the prototype in
 * BOTH builders identically — that's fine, the prototype assertion in `expectSameContext` covers it.
 */
const SHARED_ARRAY = ["A", "B"];
const SHARED_OBJECT = { id: "X" };

const VALUES = [
  "",
  null,
  undefined,
  "Y",
  "N",
  true,
  false,
  0,
  7,
  "abc",
  "A5ABE40B99F94D94A5FAAC741E659EA5",
  Number.NaN,
  SHARED_ARRAY,
  SHARED_OBJECT,
] as const;

/** Inserts or removes one underscore at a seeded interior position (e.g. AD_OrgID, ADORG_ID). */
const toggleUnderscoreAt = (rnd: Rnd, name: string): string => {
  if (name.length < 2) return name;
  const pos = 1 + Math.floor(rnd() * (name.length - 1));
  return name[pos] === "_" ? name.slice(0, pos) + name.slice(pos + 1) : `${name.slice(0, pos)}_${name.slice(pos)}`;
};

const variantOf = (rnd: Rnd, name: string): string =>
  pick(rnd, [
    name,
    name.toLowerCase(),
    name.toUpperCase(),
    name.replace(/_/g, ""),
    name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase(),
    `#${name}`,
    `$${name}`,
    `${name}$_identifier`,
    toggleUnderscoreAt(rnd, name),
  ]);

/** A record of `size` entries mixing colliding names with unique ones. Built with fromEntries so `__proto__` is an own key. */
const genRecord = (rnd: Rnd, size: number, uniquePrefix: string): Record<string, unknown> => {
  const entries: Array<[string, unknown]> = [];
  for (let i = 0; i < size; i++) {
    const key = rnd() < 0.5 ? variantOf(rnd, pick(rnd, BASE_NAMES)) : `${uniquePrefix}${i}`;
    entries.push([key, pick(rnd, VALUES)]);
  }
  return Object.fromEntries(entries);
};

/**
 * Field metadata mapping some value keys (hqlName) to DB column names. Covers: the normal shape
 * (columnName, optionally `column.dBColumnName`), a missing `hqlName`, an empty `dBColumnName`,
 * neither `column` nor `columnName`, and occasionally an `hqlName` that only exists in the other
 * record (current <-> parent), via `crossKeys`.
 */
const genFields = (rnd: Rnd, values: Record<string, unknown>, crossKeys: string[] = []): Record<string, Field> => {
  const fields: Record<string, Field> = {};
  for (const key of Object.keys(values)) {
    if (rnd() < 0.6) continue;
    const dbColumn = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2");

    const hqlRoll = rnd();
    const hqlName = hqlRoll < 0.1 ? undefined : hqlRoll < 0.2 && crossKeys.length > 0 ? pick(rnd, crossKeys) : key;

    const shapeRoll = rnd();
    const field: Record<string, unknown> = {};
    if (hqlName !== undefined) field.hqlName = hqlName;

    if (shapeRoll >= 0.15) {
      field.columnName = dbColumn;
      if (shapeRoll < 0.3) {
        field.column = { dBColumnName: "" };
      } else if (shapeRoll < 0.5) {
        field.column = { dBColumnName: `${dbColumn}_DB` };
      }
    }
    // shapeRoll < 0.15: neither `column` nor `columnName`.

    fields[`f_${key}`] = field as unknown as Field;
  }
  return fields;
};

const genOptions = (rnd: Rnd, sizes: { session: number; record: number; aux: number; parent: number }) => {
  const values = genRecord(rnd, sizes.record, "rec");
  const parentValues = rnd() < 0.7 ? genRecord(rnd, sizes.parent, "par") : undefined;
  const defaultValueRoll = rnd();
  const options: EvaluationContextOptions = {
    context: genRecord(rnd, sizes.session, "#ATTR_"),
    auxiliaryInputs: rnd() < 0.7 ? (genRecord(rnd, sizes.aux, "aux") as Record<string, string>) : undefined,
    values,
    fields: genFields(rnd, values, parentValues ? Object.keys(parentValues) : []),
    parentValues,
    parentFields: parentValues ? genFields(rnd, parentValues, Object.keys(values)) : undefined,
    normalizeValues: rnd() < 0.85,
    defaultValue: defaultValueRoll < 0.15 ? "DEF" : defaultValueRoll < 0.25 ? null : undefined,
    windowId: rnd() < 0.5 ? "W1" : undefined,
  };
  return options;
};

/**
 * Every key plus its case, underscore, prefixed, identifier, snake-case and interior/trailing
 * underscore variants, plus missing and inherited names.
 */
const probesFor = (keys: string[]): string[] => {
  const probes = new Set<string>([
    "missing_name",
    "MISSING",
    "toString",
    "constructor",
    "__proto__",
    "hasOwnProperty",
    "",
  ]);
  for (const key of keys) {
    probes.add(key);
    probes.add(key.toLowerCase());
    probes.add(key.toUpperCase());
    probes.add(key.replace(/_/g, ""));
    probes.add(`_${key}`);
    probes.add(`@${key}@`);
    probes.add(`#${key}`);
    probes.add(`$${key}`);
    probes.add(`${key}$_identifier`);

    const snake = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
    probes.add(snake);
    probes.add(snake.toLowerCase());

    if (key.length > 1) {
      probes.add(`${key[0]}_${key.slice(1)}`);
    }
    probes.add(`${key}_`);
  }
  return [...probes];
};

type Mismatch = { probe: string; kind: "get" | "has"; actual: unknown; expected: unknown };

/** Raw stored values, bypassing the `get` trap (catches null vs undefined the trap's fallback hides). */
const rawOwnValues = (x: Record<string, any>): unknown[] =>
  Object.keys(x).map((k) => Object.getOwnPropertyDescriptor(x, k)?.value);

/** Objects/functions must round-trip by reference (no cloning); primitives compare by value, NaN included. */
const sameProbeValue = (actualVal: unknown, expectedVal: unknown): boolean => {
  if (expectedVal !== null && (typeof expectedVal === "object" || typeof expectedVal === "function")) {
    return Object.is(actualVal, expectedVal);
  }
  return actualVal === expectedVal || (Number.isNaN(actualVal) && Number.isNaN(expectedVal));
};

const expectSameContext = (actual: Record<string, any>, expected: Record<string, any>) => {
  expect(Object.keys(actual)).toEqual(Object.keys(expected));
  expect(Object.getPrototypeOf(actual)).toBe(Object.getPrototypeOf(expected));
  expect(rawOwnValues(actual)).toEqual(rawOwnValues(expected));

  const mismatches: Mismatch[] = [];
  for (const probe of probesFor(Object.keys(expected))) {
    const actualVal = actual[probe];
    const expectedVal = expected[probe];
    if (!sameProbeValue(actualVal, expectedVal)) {
      mismatches.push({ probe, kind: "get", actual: actualVal, expected: expectedVal });
    }

    const actualHas = probe in actual;
    const expectedHas = probe in expected;
    if (actualHas !== expectedHas) {
      mismatches.push({ probe, kind: "has", actual: actualHas, expected: expectedHas });
    }
  }

  // Symbol probes: the get/has traps fall through to Reflect for non-string props.
  const actualTag = Reflect.get(actual, Symbol.toStringTag);
  const expectedTag = Reflect.get(expected, Symbol.toStringTag);
  if (!Object.is(actualTag, expectedTag)) {
    mismatches.push({ probe: "Symbol.toStringTag", kind: "get", actual: actualTag, expected: expectedTag });
  }
  const actualHasIterator = Reflect.has(actual, Symbol.iterator);
  const expectedHasIterator = Reflect.has(expected, Symbol.iterator);
  if (actualHasIterator !== expectedHasIterator) {
    mismatches.push({
      probe: "Symbol.iterator",
      kind: "has",
      actual: actualHasIterator,
      expected: expectedHasIterator,
    });
  }

  expect(mismatches).toEqual([]);
};

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
