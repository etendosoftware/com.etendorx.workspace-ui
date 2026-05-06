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
 * Thrown when the parameters required to launch a legacy iframe process cannot be
 * resolved from either the backend metadata or the fallback data.json mapping.
 *
 * Callers should display an error modal and log the context for diagnosis.
 */
export class LegacyProcessUnresolvedError extends Error {
  readonly buttonId: string;
  readonly columnName: string | undefined;

  constructor(buttonId: string, columnName?: string) {
    const columnSuffix = columnName ? ` (column: ${columnName})` : "";
    const message = `Legacy process parameters not found for button '${buttonId}'${columnSuffix}. Contact with the support team.`;
    super(message);
    // Required for ES5-compiled TypeScript classes that extend built-ins
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "LegacyProcessUnresolvedError";
    this.buttonId = buttonId;
    this.columnName = columnName;
  }
}
