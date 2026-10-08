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

/**
 * Duration, in milliseconds, of the expand/collapse animation of a form section.
 * Fields of a section that has just been expanded only become reachable once it ends.
 */
export const SECTION_TRANSITION_MS = 300;

/**
 * Resolves the id of the section a field is rendered in, following the same rule
 * useFormFields applies when grouping: its AD_FieldGroup, or the main section.
 *
 * @param field - Field metadata holding the optional field group id
 * @returns Id of the section that contains the field
 */
export function resolveFieldSectionId(field: { fieldGroup?: string | null }): string {
  return field.fieldGroup || MAIN_SECTION_ID;
}

/**
 * Adds the given sections to the expanded ones without duplicates.
 *
 * Returns the very same `current` array when every section is already expanded,
 * so callers can detect that nothing changed and skip a needless state update.
 *
 * @param current - Ids of the sections currently expanded
 * @param sectionIds - Ids of the sections that must end up expanded
 * @returns The expanded sections including the requested ones
 */
export function addSectionsToExpand(current: string[], sectionIds: readonly string[]): string[] {
  const missing = sectionIds.filter((id, index) => !current.includes(id) && sectionIds.indexOf(id) === index);
  if (missing.length === 0) return current;
  return [...current, ...missing];
}
