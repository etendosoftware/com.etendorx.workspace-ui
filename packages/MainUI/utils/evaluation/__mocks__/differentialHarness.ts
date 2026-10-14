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

/**
 * Seeded input generators and the context comparison used by the evaluation-context differential tests
 * (`buildEvaluationContext.differential.test.ts`, `sharedEvaluationContext.differential.test.ts`).
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import type { EvaluationContextOptions } from "../buildEvaluationContext";

/** Deterministic PRNG so every failure is reproducible from its seed. */
export const mulberry32 = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Rnd = () => number;
export const pick = <T>(rnd: Rnd, items: readonly T[]): T => items[Math.floor(rnd() * items.length)];

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

export const VALUES = [
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
export const genRecord = (rnd: Rnd, size: number, uniquePrefix: string): Record<string, unknown> => {
  const entries: Array<[string, unknown]> = [];
  for (let i = 0; i < size; i++) {
    const key = rnd() < 0.5 ? variantOf(rnd, pick(rnd, BASE_NAMES)) : `${uniquePrefix}${i}`;
    entries.push([key, pick(rnd, VALUES)]);
  }
  return Object.fromEntries(entries);
};

/** Mostly the value key itself; sometimes missing, sometimes a key of the other record. */
const pickHqlName = (rnd: Rnd, key: string, crossKeys: string[]): string | undefined => {
  const roll = rnd();
  if (roll < 0.1) return undefined;
  if (roll < 0.2 && crossKeys.length > 0) return pick(rnd, crossKeys);
  return key;
};

/** The column part of a field: none (roll < 0.15), `columnName` only, or `columnName` plus an empty or set `dBColumnName`. */
const fieldShape = (roll: number, dbColumn: string): Record<string, unknown> => {
  if (roll < 0.15) return {};
  if (roll < 0.3) return { columnName: dbColumn, column: { dBColumnName: "" } };
  if (roll < 0.5) return { columnName: dbColumn, column: { dBColumnName: `${dbColumn}_DB` } };
  return { columnName: dbColumn };
};

/** `"DEF"`, `null` or no default, so the proxy's fallback is exercised with each. */
const pickDefaultValue = (roll: number): unknown => {
  if (roll < 0.15) return "DEF";
  if (roll < 0.25) return null;
  return undefined;
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

    const hqlName = pickHqlName(rnd, key, crossKeys);
    const field = fieldShape(rnd(), dbColumn);
    if (hqlName !== undefined) field.hqlName = hqlName;

    fields[`f_${key}`] = field as unknown as Field;
  }
  return fields;
};

export const genOptions = (rnd: Rnd, sizes: { session: number; record: number; aux: number; parent: number }) => {
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
    defaultValue: pickDefaultValue(defaultValueRoll),
    windowId: rnd() < 0.5 ? "W1" : undefined,
  };
  return options;
};

/**
 * Every key plus its case, underscore, prefixed, identifier, snake-case and interior/trailing
 * underscore variants, plus missing and inherited names.
 */
export const probesFor = (keys: string[]): string[] => {
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

export const expectSameContext = (actual: Record<string, any>, expected: Record<string, any>) => {
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

