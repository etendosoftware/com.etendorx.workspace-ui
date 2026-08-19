/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/**
 * @fileoverview Maps an OAuth scope to a bundled icon.
 *
 * The middleware publishes an `iconUrl` per scope pointing at img.icons8.com. Loading it would make
 * the dialog depend on a third-party host that can fail, be blocked, or simply be unreachable from a
 * closed network, so the icon is resolved locally instead.
 *
 * The keys mirror the `labelMap` the classic handler computes and never uses
 * (ETRX_GetMiddlewareToken.js:80-81) — matching a scope by substring was the intent there.
 */

import CalendarIcon from "@workspaceui/componentlibrary/src/assets/icons/calendar.svg";
import HardDriveIcon from "@workspaceui/componentlibrary/src/assets/icons/hard-drive.svg";
import KeyIcon from "@workspaceui/componentlibrary/src/assets/icons/key.svg";
import MailIcon from "@workspaceui/componentlibrary/src/assets/icons/mail.svg";

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

/** Ordered so the first substring hit wins; `mail` must not shadow `gmail`'s own entry. */
const SCOPE_ICONS: ReadonlyArray<readonly [string, IconComponent]> = [
  ["drive", HardDriveIcon],
  ["calendar", CalendarIcon],
  ["gmail", MailIcon],
  ["mail", MailIcon],
];

/**
 * Resolves the icon for a scope URL.
 *
 * @param scope - The OAuth scope, e.g. `https://www.googleapis.com/auth/drive.file`.
 * @returns The matching icon, or a generic key icon when the scope is unrecognised — a new scope
 *   must still render a usable button rather than an empty square.
 */
export const getScopeIcon = (scope: string): IconComponent => {
  const needle = scope.toLowerCase();
  for (const [key, icon] of SCOPE_ICONS) {
    if (needle.includes(key)) return icon;
  }
  return KeyIcon;
};
