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

import type { Field, Tab, WindowMetadata } from "@workspaceui/api-client/src/api/types";

export interface HelpField {
  id: string;
  name: string;
  helpComment: string;
}

export interface HelpTabSection {
  id: string;
  name: string;
  helpComment: string;
  fields: HelpField[];
}

/**
 * Determines whether the Help access should be shown for a given window.
 * Classic shows Help whenever there is help text anywhere in the window —
 * the window's own blurb (AD_Window.HELP), a tab's, or a field's — not just
 * when the window-level blurb is set. A window like "Toolbar" has no
 * AD_Window.HELP but every field does, and Classic still shows its Help page.
 */
export function shouldShowHelp(window: WindowMetadata | null | undefined): boolean {
  if (!window) return false;
  if (window.helpComment?.trim()) return true;
  return buildHelpSections(window).some((section) => section.helpComment || section.fields.length > 0);
}

/**
 * Resolves the effective help text for a field: the field's own help comment,
 * falling back to its column's help comment when the field has none.
 *
 * field.column is typed as required on Field, but live metadata has shown it
 * can genuinely be null/undefined at runtime for some field kinds — read
 * defensively.
 */
function getFieldHelp(field: Field): string {
  const own = field.helpComment?.trim();
  if (own) return own;
  return field.column?.helpComment?.trim() ?? "";
}

/**
 * Builds the ordered, filtered list of help sections (one per tab) for a
 * window's Help view: inactive tabs omitted (Classic's Help view excludes
 * them the same way), tabs ordered by sequenceNumber, fields within each tab
 * ordered by sequenceNumber, audit/inactive/non-displayed fields omitted
 * (Classic only documents fields the user actually sees on the form — hidden
 * key columns, status-bar-only fields, etc. never got an entry there either).
 * Fields with no help text (own or column fallback) are still listed, with
 * an empty helpComment — Classic lists every displayed field's name too,
 * even the ones with nothing written under them.
 */
export function buildHelpSections(window: WindowMetadata): HelpTabSection[] {
  const orderedTabs = [...window.tabs]
    .filter((tab) => tab.active !== false)
    .sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0));

  return orderedTabs.map((tab: Tab) => {
    const fields = Object.values(tab.fields)
      .filter((field) => !field.isAuditField && field.active !== false && field.displayed)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map((field) => ({ id: field.id, name: field.name, helpComment: getFieldHelp(field) }));

    return {
      id: tab.id,
      name: tab.name,
      helpComment: tab.helpComment?.trim() ?? "",
      fields,
    };
  });
}
