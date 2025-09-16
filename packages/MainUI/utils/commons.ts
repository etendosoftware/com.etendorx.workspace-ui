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
 * A collection of common utility functions for general use throughout the application.
 * @module utils/commons
 */

/**
 * Checks if an object is empty (has no own enumerable properties).
 *
 * @template T - A generic type that extends Record<string, unknown> to ensure type safety with object literals
 * @param {T} obj - The object to check
 * @returns {boolean} True if the object has no own enumerable properties, false otherwise
 *
 * @example
 * // Returns true
 * isEmptyObject({});
 *
 * @example
 * // Returns false
 * isEmptyObject({ key: 'value' });
 */
export const isEmptyObject = <T extends Record<string, unknown>>(obj: T): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Extracts the first non-empty value from a list of keys in a given object.
 *
 * @template T - The type of the input object
 * @template K - A union of the object's keys as strings
 * @param {T} obj - The object to extract values from
 * @param {K[]} keys - An array of keys to check in order
 * @param {string} defaultValue - A fallback value returned when no key contains a non-empty value
 * @returns {string} The first non-empty value found (converted to string), or the default value
 *
 * A value is considered "non-empty" if it is not `undefined`, `null`, or an empty string (`""`).
 *
 * @example
 * const user = { name: '', username: 'jdoe', email: 'jdoe@example.com' };
 * // Returns 'jdoe'
 * extractValue(user, ['name', 'username', 'email'], 'N/A');
 *
 * @example
 * const data = { a: null, b: '', c: undefined };
 * // Returns 'default'
 * extractValue(data, ['a', 'b', 'c'], 'default');
 */
export const extractValue = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
  defaultValue: string
): string => {
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return defaultValue;
};

/**
 * Extracts and flattens key-value pairs from a nested object structure
 *
 * Transforms an object where values contain nested objects with a 'value' property
 * into a flat key-value record. This is commonly used for form data processing,
 * session attribute extraction, and API response transformation.
 *
 * @template T - Type of the source object containing nested value structures
 * @param sourceData - Object with nested structure containing 'value' properties
 * @returns Flat record with string keys and values, empty strings for nullish values
 *
 * @example
 * ```typescript
 * const formData = {
 *   fieldA: { value: "hello", meta: "..." },
 *   fieldB: { value: null, meta: "..." },
 *   fieldC: { value: 42, meta: "..." }
 * };
 *
 * const flattened = extractKeyValuePairs(formData);
 * // Returns: { fieldA: "hello", fieldB: "", fieldC: "42" }
 * ```
 */
export const extractKeyValuePairs = <T extends Record<string, { value: unknown }>>(
  sourceData: T
): Record<string, string> => {
  return Object.entries(sourceData).reduce(
    (accumulator, [key, { value }]) => {
      accumulator[key] = String(value ?? "");
      return accumulator;
    },
    {} as Record<string, string>
  );
};
