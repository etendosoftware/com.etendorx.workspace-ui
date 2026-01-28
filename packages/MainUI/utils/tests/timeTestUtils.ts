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

/**
 * Creates a mock Field object for testing time-related components.
 * All required Field properties are provided with sensible defaults.
 */
export const createMockTimeField = (overrides: Partial<Field> = {}): Field => ({
  hqlName: "testTime",
  inputName: "testTime",
  columnName: "test_time",
  process: "",
  shownInStatusBar: false,
  tab: "test-tab",
  displayed: true,
  startnewline: false,
  showInGridView: true,
  fieldGroup$_identifier: "field-group",
  fieldGroup: "group1",
  isMandatory: false,
  column: {},
  name: "Test Time",
  id: "test-time-id",
  module: "test-module",
  hasDefaultValue: false,
  refColumnName: "",
  targetEntity: "",
  gridProps: {} as Field["gridProps"],
  type: "time",
  field: [],
  refList: [],
  referencedEntity: "",
  referencedWindowId: "",
  referencedTabId: "",
  isReadOnly: false,
  isDisplayed: true,
  sequenceNumber: 1,
  isUpdatable: true,
  description: "Test time field",
  helpComment: "Test time help",
  isActive: true,
  gridDisplayLogic: "",
  ...overrides,
});

/**
 * Mock implementation for formatUTCTimeToLocal.
 * Returns "12:00:00" for ISO datetime strings (containing "T"),
 * otherwise returns the value as-is.
 */
export const mockFormatUTCTimeToLocal = jest.fn((value: string) => {
  if (!value) return "";
  return value.includes("T") ? "12:00:00" : value;
});

/**
 * Mock implementation for formatLocalTimeToUTCPayload.
 * Returns an ISO datetime string using a fixed date.
 */
export const mockFormatLocalTimeToUTCPayload = jest.fn((value: string) => {
  if (!value) return "";
  return `2025-01-28T${value}`;
});

/**
 * Standard date utils mock configuration.
 * Use this with jest.mock("@/utils/date/utils", () => getDateUtilsMock())
 */
export const getDateUtilsMock = () => ({
  formatUTCTimeToLocal: mockFormatUTCTimeToLocal,
  formatLocalTimeToUTCPayload: mockFormatLocalTimeToUTCPayload,
});
