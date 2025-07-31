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
