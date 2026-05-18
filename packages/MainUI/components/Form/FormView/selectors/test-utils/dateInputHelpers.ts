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

import type { Field } from "@workspaceui/api-client/src/api/types";

/** ISO date string used as the base fixture across DateInput tests. */
export const MOCK_ISO_DATE = "2025-03-15";

/** Locale placeholder returned by the mocked getLocaleDatePlaceholder. */
export const MOCK_PLACEHOLDER = "dd/mm/yyyy";

/**
 * Minimal Field fixture compatible with DateInput's required shape.
 * Cast via `as unknown as Field` at the call site to avoid importing the full type.
 */
export const mockDateField = {
  id: "field-date-test",
  hqlName: "dateField",
  name: "Date Field",
  isMandatory: false,
  helpComment: "",
} satisfies Partial<Field>;

/**
 * Returns the formatted display string that the mockFormatClassicDate implementation
 * produces for a given ISO date. Keeps assertions DRY.
 */
export const expectedDisplay = (isoDate: string) => `formatted(${isoDate})`;
