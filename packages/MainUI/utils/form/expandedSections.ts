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
 * Section id that useFormFields assigns to the fields without an explicit
 * AD_FieldGroup, i.e. the main section of the form.
 */
export const MAIN_SECTION_ID = "_main";

/**
 * Minimal shape of a `useFormFields().groups` entry needed to decide whether a
 * section starts expanded. Declared structurally so this module stays free of
 * hook/metadata dependencies and therefore trivially testable.
 */
export type FormSectionGroupEntry = readonly [string | null, { fieldGroupCollapsed?: boolean }];

/**
 * Decides whether a section is expanded by default, following the metadata:
 * - the main section is always expanded,
 * - any other section is expanded only when AD_FieldGroup.IsCollapsed is
 *   explicitly false (an undefined flag means collapsed).
 *
 * @param entry - Section entry as produced by useFormFields
 * @returns True when the section must start expanded
 */
function isInitiallyExpanded([id, group]: FormSectionGroupEntry): boolean {
  if (id === MAIN_SECTION_ID) return true;
  return group.fieldGroupCollapsed === false;
}

/**
 * Computes the ids of the form sections that must start expanded, based on the
 * `fieldGroupCollapsed` metadata flag (AD_FieldGroup.IsCollapsed).
 *
 * Used only to seed the expansion state the first time a tab's form is opened;
 * afterwards the user preference persisted per tab takes precedence.
 *
 * @param groups - Section entries as produced by useFormFields
 * @returns Ids of the sections that must start expanded, in the given order
 */
export function computeInitialExpandedSections(groups: readonly FormSectionGroupEntry[]): string[] {
  return groups.filter(isInitiallyExpanded).map(([id]) => String(id ?? MAIN_SECTION_ID));
}
