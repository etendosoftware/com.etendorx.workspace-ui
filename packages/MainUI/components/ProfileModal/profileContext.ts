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

import type { TranslationKeys } from "@workspaceui/componentlibrary/src/locales/types";
import { type CatalogLabelResolvers, resolveCatalogLabel } from "@/utils/catalogLabel";

/** Any session entity that carries a display name (role, client, organization, warehouse). */
interface NamedEntity {
  name?: string;
}

/** The working context of the session, as shown on the profile button. */
export interface ProfileContext {
  userName?: string;
  role?: NamedEntity;
  client?: NamedEntity;
  organization?: NamedEntity;
  warehouse?: NamedEntity;
}

interface ContextLine {
  /** `AD_MESSAGE` search key Classic uses for the label (`ob-user-profile-widget.js`). */
  code: string;
  /** Local translation used when the backend catalog does not define the code. */
  fallbackKey: TranslationKeys;
  /** Reads the value of the line from the context. */
  pick: (context: ProfileContext) => NamedEntity | undefined;
}

/** Lines of the tooltip, in the order Classic shows them; the warehouse is an addition of the new UI. */
export const PROFILE_CONTEXT_LINES: readonly ContextLine[] = [
  { code: "UINAVBA_Role", fallbackKey: "navigation.profile.contextRole", pick: (context) => context.role },
  { code: "UINAVBA_Client", fallbackKey: "navigation.profile.contextClient", pick: (context) => context.client },
  {
    code: "UINAVBA_Organization",
    fallbackKey: "navigation.profile.contextOrganization",
    pick: (context) => context.organization,
  },
  {
    code: "UINAVBA_Warehouse",
    fallbackKey: "navigation.profile.contextWarehouse",
    pick: (context) => context.warehouse,
  },
];

/**
 * Builds the text of the profile button tooltip: the user name followed by one `Label: value` line
 * per context item. Items without a value (e.g. a session without warehouse) are left out.
 *
 * @param context the current session context
 * @param resolvers the backend catalog and local translation resolvers for the labels
 * @returns the tooltip text, one item per line, or an empty string when there is nothing to show
 */
export function buildProfileContextTooltip(context: ProfileContext, resolvers: CatalogLabelResolvers): string {
  const lines: string[] = [];
  if (context.userName) {
    lines.push(context.userName);
  }
  for (const { code, fallbackKey, pick } of PROFILE_CONTEXT_LINES) {
    const value = pick(context)?.name;
    if (value) {
      lines.push(`${resolveCatalogLabel(code, fallbackKey, resolvers)}: ${value}`);
    }
  }
  return lines.join("\n");
}
