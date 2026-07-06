/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
 * Generates a local-only record id for new rows added to a P&E grid before
 * the surrounding process is executed. Uses {@link crypto.randomUUID} when
 * available; falls back to a Math.random-based v4 UUID for environments
 * without crypto. The result is uppercased and stripped of dashes to match
 * the id shape consumed by the local datasource in WindowReferenceGrid.
 */
export const generateLocalRecordId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").toUpperCase();
  }
  // Math.random() is only a fallback for environments without Web Crypto
  // (the crypto.randomUUID branch above is preferred and always used when available).
  // The id it produces is a local-only, ephemeral key for an unsaved grid row — never
  // a security token, session id, or anything else where predictability/collision matters.
  // It is discarded and replaced by the real database-generated id once the record is saved.
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx"
    .replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0; // NOSONAR typescript:S2245
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toUpperCase();
};

/**
 * Builds the payload for a new row inserted via the P&E grid "Add row" button.
 * Merges MRT's tracked {@code values} with any inline edits accumulated under
 * {@code row.original}, attaching a freshly generated local id.
 *
 * @param values       values tracked by MaterialReactTable for the creating row
 * @param rowOriginal  inline edits applied via custom cell editors (may be undefined)
 * @returns object containing the generated id and the merged record payload
 */
export const buildLocalGridRecord = <T extends Record<string, unknown>>(
  values: T,
  rowOriginal?: T
): { id: string; record: T & { id: string } } => {
  const merged = { ...values, ...(rowOriginal ?? ({} as T)) };
  const id = generateLocalRecordId();
  return { id, record: { ...merged, id } };
};
