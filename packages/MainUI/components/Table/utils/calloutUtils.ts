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

import type { FormInitializationResponse, Field, Tab } from "@workspaceui/api-client/src/api/types";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { logger } from "@/utils/logger";

/**
 * Shared utilities for applying callout responses to inline editing rows
 * Reuses the same logic from FormView's BaseSelector for consistency
 */

interface CalloutValueUpdate {
  fieldName: string;
  value: unknown;
  identifier?: string;
  entries?: Array<{ id: string; value: string; label: string }>;
}

/**
 * Process column values from callout response into field updates
 * Based on BaseSelector's applyColumnValues logic
 */
export function processCalloutColumnValues(
  columnValues: FormInitializationResponse["columnValues"],
  tab: Tab
): CalloutValueUpdate[] {
  const updates: CalloutValueUpdate[] = [];
  const fieldsByColumnName = getFieldsByColumnName(tab);

  for (const [columnName, columnValue] of Object.entries(columnValues || {})) {
    const targetField = fieldsByColumnName[columnName];
    if (!targetField) {
      logger.warn(`[CalloutUtils] Field not found for column ${columnName}`);
      continue;
    }

    const { value, identifier } = columnValue;
    const fieldName = targetField.hqlName || columnName;

    const update: CalloutValueUpdate = {
      fieldName,
      value,
      identifier,
    };

    // Handle restricted entries for TABLEDIR fields
    const withEntries = (columnValue as any).entries;
    const isTableDirField =
      targetField.column?.reference === FIELD_REFERENCE_CODES.TABLE_DIR_19 ||
      targetField.column?.reference === FIELD_REFERENCE_CODES.TABLE_DIR_18;

    if (withEntries?.length) {
      update.entries = withEntries.map((e: any) => ({
        id: e.id,
        value: e.id,
        label: e._identifier,
      }));
    } else if (identifier && value && isTableDirField) {
      // Create synthetic entry for TABLEDIR fields with identifier but no entries
      update.entries = [
        {
          id: String(value),
          value: String(value),
          label: identifier,
        },
      ];
    }

    updates.push(update);
  }

  return updates;
}

/**
 * Process auxiliary input values from callout response into field updates
 * Based on BaseSelector's applyAuxiliaryInputValues logic
 */
export function processCalloutAuxiliaryValues(
  auxiliaryInputValues: FormInitializationResponse["auxiliaryInputValues"],
  tab: Tab
): CalloutValueUpdate[] {
  const updates: CalloutValueUpdate[] = [];
  const fieldsByColumnName = getFieldsByColumnName(tab);

  for (const [columnName, { value }] of Object.entries(auxiliaryInputValues || {})) {
    const targetField = fieldsByColumnName[columnName];
    const fieldName = targetField?.hqlName || columnName;

    updates.push({
      fieldName,
      value,
    });
  }

  return updates;
}

/**
 * Helper to get the appropriate key for storing identifiers and entries
 * Uses inputName for consistency with cell rendering and backend expectations
 */
export function getIdentifierKey(field: Field): string {
  const baseKey = field.inputName || field.hqlName || field.name;
  return `${baseKey}$_identifier`;
}

/**
 * Helper to get the appropriate key for storing selector entries
 * Uses inputName for consistency with cell rendering
 */
export function getEntriesKey(field: Field): string {
  const baseKey = field.inputName || field.hqlName || field.name;
  return `${baseKey}$_entries`;
}

/**
 * Check if a field is a TABLEDIR type field
 */
export function isTableDirField(field: Field): boolean {
  return (
    field.column?.reference === FIELD_REFERENCE_CODES.TABLE_DIR_19 ||
    field.column?.reference === FIELD_REFERENCE_CODES.TABLE_DIR_18
  );
}
