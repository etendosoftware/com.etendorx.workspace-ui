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

import {
  buildEvaluationContext,
  type EvaluationContext,
  type EvaluationContextOptions,
} from "./buildEvaluationContext";

/**
 * Every field with display or read-only logic used to build its own context from
 * `{ ...record, ...dependencyValues }`: the same record (≈180 keys) and the same tab fields, session and
 * parent, re-processed once per field (127 builds per form pass in the Sales Invoice header). The
 * dependency values are a handful of keys, usually equal to what the record already holds.
 *
 * {@link getEvaluationContext} returns a context identical to
 * `buildEvaluationContext({ ...options, values: { ...options.values, ...overlay } })`, sharing it between
 * callers:
 * - Inputs are compared by identity (`values` is the record; the other options are compared one by one).
 *   A record not seen before shares the contexts of a recent record with the same content (same keys in
 *   the same order, `Object.is` values): callers that each take their own snapshot of the same form values
 *   (getValues(), `{ ...record, ...formValues }`) built up to 31 contexts per form Next from 13 inputs.
 *   The build copies the values, so the context depends only on that content.
 * - When every overlay key is an own key of the record with the same value (`Object.is`), the merged
 *   values equal the record, key order included, so the record's context is returned.
 * - Otherwise the context for that overlay is shared when all overlay values are primitives (keyed by
 *   the overlay entries in order, which also fixes the order of keys appended after the record's).
 *   Object values are not shared: a fresh context is built, as before.
 * - A write through a shared context's proxy drops it from the cache at once, so no other caller sees
 *   the mutation. Writes are not expected (expressions only read), but stay isolated anyway.
 *
 * Inputs must not be mutated in place (records, session, fields are replaced, not edited): the callers'
 * `useMemo` dependencies already rely on that.
 */

/** Options compared by identity besides `values`. */
const IDENTITY_OPTIONS = [
  "fields",
  "parentValues",
  "parentFields",
  "context",
  "auxiliaryInputs",
  "normalizeValues",
  "defaultValue",
  "windowId",
] as const satisfies readonly (keyof EvaluationContextOptions)[];

interface Entry {
  options: EvaluationContextOptions;
  /** Context of the record itself (no overlay, or an overlay that changes nothing). */
  base?: EvaluationContext;
  /** Contexts per overlay signature. */
  byOverlay: Map<string, EvaluationContext>;
}

/** Stands for a missing record (`{ ...undefined }` is `{}`). */
const EMPTY_RECORD: Record<string, unknown> = {};
const MAX_ENTRIES_PER_RECORD = 4;
const MAX_OVERLAYS_PER_ENTRY = 256;
const MAX_RECENT_RECORDS = 8;

const entriesByRecord = new WeakMap<object, Entry[]>();
/** Records last looked up, most recent first, to find one with the same content. */
const recentRecords: Record<string, unknown>[] = [];

/** Same own keys in the same order, with `Object.is` values. */
const sameContent = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (key !== keysB[i] || !Object.is(a[key], b[key])) return false;
  }
  return true;
};

const entriesFor = (record: Record<string, unknown>): Entry[] => {
  let entries = entriesByRecord.get(record);
  if (!entries) {
    const twin = recentRecords.find((recent) => sameContent(recent, record));
    entries = (twin && entriesByRecord.get(twin)) || [];
    entriesByRecord.set(record, entries);
  }
  const index = recentRecords.indexOf(record);
  if (index !== 0) {
    if (index > 0) recentRecords.splice(index, 1);
    recentRecords.unshift(record);
    if (recentRecords.length > MAX_RECENT_RECORDS) recentRecords.pop();
  }
  return entries;
};

const sameOptions = (a: EvaluationContextOptions, b: EvaluationContextOptions) =>
  IDENTITY_OPTIONS.every((key) => Object.is(a[key], b[key]));

const getEntry = (record: Record<string, unknown>, options: EvaluationContextOptions): Entry => {
  const entries = entriesFor(record);
  const found = entries.find((entry) => sameOptions(entry.options, options));
  if (found) return found;

  const entry: Entry = { options, byOverlay: new Map() };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES_PER_RECORD) entries.pop();
  return entry;
};

const hasOwn = (target: object, key: string) => Object.prototype.hasOwnProperty.call(target, key);

/** True when `{ ...record, ...overlay }` has the same keys, in the same order, and values as `record`. */
const overlayChangesNothing = (record: Record<string, unknown>, overlay: Record<string, unknown>) =>
  Object.keys(overlay).every((key) => hasOwn(record, key) && Object.is(record[key], overlay[key]));

const encodePrimitive = (value: unknown): string | null => {
  switch (typeof value) {
    case "string":
      return `s${value}`;
    case "boolean":
      return value ? "bT" : "bF";
    case "undefined":
      return "u";
    case "number":
      return Object.is(value, -0) ? "n-0" : `n${value}`;
    default:
      return value === null ? "z" : null;
  }
};

/** A key for the overlay entries in order, or null when a value is not a primitive. */
const overlaySignature = (overlay: Record<string, unknown>): string | null => {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(overlay)) {
    const encoded = encodePrimitive(value);
    if (encoded === null) return null;
    parts.push(key, encoded);
  }
  return JSON.stringify(parts);
};

/**
 * The context `buildEvaluationContext({ ...options, values: { ...options.values, ...overlay } })` would
 * build, shared with every other caller that resolves to the same inputs. See the module comment.
 */
export const getEvaluationContext = (
  options: EvaluationContextOptions,
  overlay: Record<string, unknown> = {}
): EvaluationContext => {
  const record = options.values ?? EMPTY_RECORD;

  // No sharing when the spread copy may not match the record: another prototype (inherited reads), or an
  // own `__proto__` key, which native spread copies but down-levelled spread (`Object.assign`) turns
  // into a prototype assignment. Field names never are `__proto__`.
  if (
    Object.getPrototypeOf(record) !== Object.prototype ||
    hasOwn(record, "__proto__") ||
    hasOwn(overlay, "__proto__")
  ) {
    return buildEvaluationContext({ ...options, values: { ...record, ...overlay } });
  }

  const entry = getEntry(record, options);

  if (overlayChangesNothing(record, overlay)) {
    if (!entry.base) {
      const built = buildEvaluationContext({
        ...options,
        values: record,
        onWrite: () => {
          if (entry.base === built) entry.base = undefined;
        },
      });
      entry.base = built;
    }
    return entry.base;
  }

  const signature = overlaySignature(overlay);
  if (signature === null) {
    return buildEvaluationContext({ ...options, values: { ...record, ...overlay } });
  }

  const cached = entry.byOverlay.get(signature);
  if (cached) return cached;

  const built = buildEvaluationContext({
    ...options,
    values: { ...record, ...overlay },
    onWrite: () => {
      if (entry.byOverlay.get(signature) === built) entry.byOverlay.delete(signature);
    },
  });
  if (entry.byOverlay.size >= MAX_OVERLAYS_PER_ENTRY) entry.byOverlay.clear();
  entry.byOverlay.set(signature, built);
  return built;
};
