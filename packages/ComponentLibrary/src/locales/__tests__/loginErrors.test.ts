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

/**
 * Guards the messages shown on the login screen after an involuntary logout.
 *
 * `TranslationKeys` is a union of both locales' keys, so the compiler accepts a key that exists in
 * only one of them, and the consumers resolve keys as plain strings at runtime. Nothing else would
 * notice a missing or renamed entry until a user is staring at a raw `login.errors.…` key.
 */

import en from "../en";
import es from "../es";

/** The keys UserProvider passes to `t()` when it closes a session on the user's behalf. */
const LOGOUT_MESSAGE_KEYS = ["sessionExpired", "defaultLogout"] as const;

const LOCALES = [
  ["en", en],
  ["es", es],
] as const;

/** Collects the dotted paths of every leaf under an object. */
function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) => leafKeys(nested, prefix ? `${prefix}.${key}` : key));
}

/**
 * Orders key paths alphabetically so two locales compare regardless of declaration order.
 *
 * The bare `sort()` default orders by UTF-16 code unit, which would misplace any future accented
 * key; `localeCompare` orders the way a reader expects.
 */
function byKeyPath(a: string, b: string): number {
  return a.localeCompare(b);
}

describe("locales/login.errors", () => {
  describe.each(LOCALES)("%s", (_name, locale) => {
    it.each(LOGOUT_MESSAGE_KEYS)("carries a title and a description for %s", (errorKey) => {
      const message = locale.login.errors[errorKey];

      expect(typeof message.title).toBe("string");
      expect(message.title.length).toBeGreaterThan(0);
      expect(typeof message.description).toBe("string");
      expect(message.description.length).toBeGreaterThan(0);
    });
  });

  // A message that exists in only one locale silently falls back to the raw key for the other.
  it("exposes the same error keys in every locale", () => {
    expect(leafKeys(es.login.errors).sort(byKeyPath)).toEqual(leafKeys(en.login.errors).sort(byKeyPath));
  });

  it("distinguishes an inactivity timeout from a system error", () => {
    expect(en.login.errors.sessionExpired.title).not.toBe(en.login.errors.defaultLogout.title);
    expect(es.login.errors.sessionExpired.title).not.toBe(es.login.errors.defaultLogout.title);
  });

  // The Spanish copy was left in English once already; a locale that repeats the English string is
  // an untranslated entry, not a translation.
  it("translates the logout messages instead of repeating the English copy", () => {
    for (const errorKey of LOGOUT_MESSAGE_KEYS) {
      expect(es.login.errors[errorKey].title).not.toBe(en.login.errors[errorKey].title);
      expect(es.login.errors[errorKey].description).not.toBe(en.login.errors[errorKey].description);
    }
  });
});
