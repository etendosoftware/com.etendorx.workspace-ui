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
 * Extension module columns follow the DB naming pattern `em_<module>_<standard_column>`.
 * Their form input names follow: `inpem<Module><StandardColumn>` (camelCase).
 *
 * This utility derives the standard `inp*` equivalent from a custom extension field,
 * allowing backend callouts and datasource filters to receive the standard field name
 * they expect (e.g. `inpcBpartnerId`) even when the form only exposes the custom one
 * (e.g. `inpemEtcrmCBpartnerId`).
 *
 * @param inputName - The field's inputName (e.g. "inpemEtcrmCBpartnerId")
 * @param columnName - The field's DB columnName (e.g. "em_etcrm_c_bpartner_id")
 * @returns The standard inp name (e.g. "inpcBpartnerId"), or undefined if not applicable.
 */
export function deriveStandardInputName(inputName: string, columnName: string): string | undefined {
  if (!inputName.startsWith("inpem")) return undefined;

  const match = columnName.toLowerCase().match(/^em_[a-z]+_(.+)$/);
  if (!match) return undefined;

  return "inp" + match[1].replace(/_([a-z0-9])/g, (_: string, c: string) => c.toUpperCase());
}
