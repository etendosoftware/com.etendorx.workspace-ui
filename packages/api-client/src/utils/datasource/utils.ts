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
