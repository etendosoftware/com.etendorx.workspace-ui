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
