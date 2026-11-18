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
 * Field-level errors returned by the datasource servlet when it rejects a save
 * (`{response: {status: -4, errors: {[propertyName]: message}}}`), keyed by the DAL
 * property name — the `hqlName` of the field.
 */
export type ServerFieldErrors = Record<string, string>;

/** Separator of the messages joined into the general save notification. */
export const SERVER_FIELD_ERRORS_SEPARATOR = "; ";

/**
 * Field-level errors of a failed save response. Entries without a text message are skipped.
 *
 * @param response The `response` object of the datasource servlet body
 * @returns The errors keyed by property name, empty when the response has none
 */
export function extractServerFieldErrors(response: Record<string, unknown> | undefined): ServerFieldErrors {
  const errors = response?.errors;
  if (!errors || typeof errors !== "object") {
    return {};
  }
  const messages = Object.entries(errors).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""
  );
  return Object.fromEntries(messages);
}

/** Indexes the fields of a tab by `hqlName`, the key of the server field errors. */
export const indexFieldsByHqlName = (fields: Record<string, Field> | undefined): Map<string, Field> =>
  new Map(Object.values(fields ?? {}).map((field) => [field.hqlName, field]));

/**
 * Replaces the property name in a server message with the label of its field, as Classic's
 * `OBViewForm.handleFieldErrors` does ("BusinessPartner.referenceNo: …" → "BusinessPartner.Reference No.: …").
 *
 * @param propertyName Property the server reported the error for
 * @param message Message returned by the server
 * @param label Label of the field, when the tab has it
 */
export const toFieldErrorMessage = (propertyName: string, message: string, label?: string): string => {
  if (!label) {
    return message;
  }
  return message.replace(propertyName, () => label);
};

/**
 * Server field errors with the property names replaced by the labels of the tab fields.
 *
 * @param errors Errors returned by the server, keyed by property name
 * @param fields Fields of the tab
 * @returns The same keys with the labelled messages
 */
export function labelServerFieldErrors(
  errors: ServerFieldErrors,
  fields: Record<string, Field> | undefined
): ServerFieldErrors {
  const fieldsByHqlName = indexFieldsByHqlName(fields);
  return Object.fromEntries(
    Object.entries(errors).map(([propertyName, message]) => [
      propertyName,
      toFieldErrorMessage(propertyName, message, fieldsByHqlName.get(propertyName)?.name),
    ])
  );
}

/**
 * Entry of the general notification for one field: the message as is when it already names the
 * field (e.g. "BusinessPartner.Reference No.: Value too long…"), otherwise prefixed with it
 * ("Accounting Date: Invalid date"), so the notification always says which field failed.
 */
const toSummaryEntry = (message: string, fieldName: string): string => {
  if (message.includes(fieldName)) {
    return message;
  }
  return `${fieldName}: ${message}`;
};

/**
 * Text of the general save notification listing every field error.
 *
 * @param errors Labelled errors (see {@link labelServerFieldErrors}), keyed by property name
 * @param fields Fields of the tab; a property without a field is named by itself
 */
export function joinServerFieldErrors(errors: ServerFieldErrors, fields: Record<string, Field> | undefined): string {
  const fieldsByHqlName = indexFieldsByHqlName(fields);
  return Object.entries(errors)
    .map(([propertyName, message]) => toSummaryEntry(message, fieldsByHqlName.get(propertyName)?.name ?? propertyName))
    .join(SERVER_FIELD_ERRORS_SEPARATOR);
}

/** Whether a save response carried at least one field error. */
export const hasServerFieldErrors = (errors: ServerFieldErrors): boolean => Object.keys(errors).length > 0;
