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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";

/** Separator between the segments of a DAL property path (e.g. `finPayment.paymentDate`). */
const PROPERTY_PATH_SEPARATOR = ".";
/** Separator Classic uses to join a property and a sub-property in a datasource key. */
const DATASOURCE_FIELD_SEPARATOR = "$";
/** Separator between the entries of the `_extraProperties` datasource parameter. */
const EXTRA_PROPERTIES_SEPARATOR = ",";

type TabFields = Record<string, Field> | undefined;

/**
 * Returns the property paths of the property fields that cross a related record
 * (e.g. `paymentDetails.finPayment.paymentDate`). Classic requests exactly these paths through
 * `_extraProperties` (OBViewTab), and the datasource returns each value under the path with `$`
 * instead of `.`, which is the `hqlName` of the field. Single-segment properties are skipped: they
 * are already properties of the tab's entity.
 */
export const getPropertyFieldPaths = (fields: TabFields): string[] => {
  const paths = Object.values(fields || {})
    .map((field) => field.column?.propertyPath)
    .filter((path): path is string => !!path?.includes(PROPERTY_PATH_SEPARATOR));
  return [...new Set(paths)];
};

/** Returns the color paths (`<field>$<colorField>`) of the fields that reference a colored entity. */
const getColorFieldPaths = (fields: TabFields): string[] =>
  Object.values(fields || {})
    .filter((field) => field.colorFieldName)
    .map((field) => `${field.hqlName || field.columnName}${DATASOURCE_FIELD_SEPARATOR}${field.colorFieldName}`);

/**
 * Builds the `_extraProperties` datasource parameter of a tab: the color paths of its colored
 * references plus the paths of its property fields. Returns an empty string when there is none.
 */
export const buildTabExtraProperties = (fields: TabFields): string =>
  [...getColorFieldPaths(fields), ...getPropertyFieldPaths(fields)].join(EXTRA_PROPERTIES_SEPARATOR);
