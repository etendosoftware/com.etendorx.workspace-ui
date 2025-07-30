/**
 * Checks whether a given string is wrapped with '@' characters.
 *
 * In the context of Etendo (or Openbravo), parameters enclosed in '@...@'
 * are treated as dynamic context variables. These variables are resolved at runtime
 * using the user's session context, for example in SQL queries, HQL, callouts, or process definitions.
 *
 * @param str - The string to check
 * @returns true if the string starts and ends with '@', and has at least one character in between
 */
export const isWrappedWithAt = (str: string): boolean => {
  return /^@[^@]+@$/.test(str);
};
