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
 * Help is only offered when the window itself has non-blank help text
 * (AD_Window.HELP); windows without it have nothing to show.
 */
export function shouldShowHelp(window: { helpComment?: string | null } | null | undefined): boolean {
  return Boolean(window?.helpComment?.trim());
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
  return (field.column as Field["column"] | null | undefined)?.helpComment?.trim() ?? "";
}

/**
 * Builds the ordered, filtered list of help sections (one per tab) for a
 * window's Help view: tabs ordered by sequenceNumber, fields within each tab
 * ordered by sequenceNumber, audit fields omitted, and fields with no help
 * text (own or column fallback) omitted.
 */
export function buildHelpSections(window: WindowMetadata): HelpTabSection[] {
  const orderedTabs = [...window.tabs].sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0));

  return orderedTabs.map((tab: Tab) => {
    const fields = Object.values(tab.fields)
      .filter((field) => !field.isAuditField)
      .map((field) => ({ field, help: getFieldHelp(field) }))
      .filter(({ help }) => help.length > 0)
      .sort((a, b) => a.field.sequenceNumber - b.field.sequenceNumber)
      .map(({ field, help }) => ({ id: field.id, name: field.name, helpComment: help }));

    return {
      id: tab.id,
      name: tab.name,
      helpComment: tab.helpComment?.trim() ?? "",
      fields,
    };
  });
}
