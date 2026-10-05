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

import type { Menu } from "@workspaceui/api-client/src/api/types";
import { MENU_ITEM_TYPES } from "./menuItemTypes";

/** Separator that tells whether a URL already carries a protocol (Classic uses the same check). */
const PROTOCOL_SEPARATOR = "://";
/** Protocol prepended to protocol-less URLs, as Classic does. */
const DEFAULT_PROTOCOL = "http://";
/** Only web protocols may be opened, so a `javascript:` or `data:` URL never reaches the browser. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Prefix of the `windowId` given to the in-app tabs that embed an External menu entry. It has no
 * `_`, so `getWindowIdFromIdentifier` keeps working on their window identifiers.
 */
export const EXTERNAL_PAGE_WINDOW_PREFIX = "external-";

/** Tells whether a menu entry is an External (external link) entry. */
export const isExternalMenuEntry = (item: Pick<Menu, "type">): boolean => item.type === MENU_ITEM_TYPES.EXTERNAL;

const hasAllowedProtocol = (url: string): boolean => {
  try {
    return ALLOWED_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
};

/**
 * Turns the URL configured in an External menu entry into an openable one: prepends `http://`
 * when it has no protocol (e.g. `example.com`) and rejects empty or non-web URLs.
 *
 * @returns the URL to open, or `null` when there is nothing safe to open.
 */
export const normalizeExternalUrl = (url?: string | null): string | null => {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  if (!trimmed.includes(PROTOCOL_SEPARATOR)) {
    candidate = `${DEFAULT_PROTOCOL}${trimmed}`;
  }
  if (!hasAllowedProtocol(candidate)) return null;
  return candidate;
};

/** Builds the `windowId` of the in-app tab that embeds the given External menu entry. */
export const buildExternalPageWindowId = (menuId: string): string => `${EXTERNAL_PAGE_WINDOW_PREFIX}${menuId}`;

/** Tells whether a `windowId` belongs to an in-app tab embedding an External menu entry. */
export const isExternalPageWindowId = (windowId?: string | null): boolean =>
  Boolean(windowId?.startsWith(EXTERNAL_PAGE_WINDOW_PREFIX));

/** Extracts the menu entry id from the `windowId` of an in-app External tab. */
export const getMenuIdFromExternalPageWindowId = (windowId: string): string =>
  windowId.slice(EXTERNAL_PAGE_WINDOW_PREFIX.length);

/**
 * Looks an External entry up by id in the menu tree.
 *
 * @returns the entry, or `undefined` when the menu has no External entry with that id.
 */
export const findExternalMenuEntry = (menu: Menu[] | null | undefined, menuId: string): Menu | undefined => {
  for (const item of menu ?? []) {
    if (item.id === menuId && isExternalMenuEntry(item)) return item;
    const found = findExternalMenuEntry(item.children, menuId);
    if (found) return found;
  }
  return undefined;
};

/**
 * Opens a URL in a new browser tab, cutting the `window.opener` link afterwards so the external
 * page cannot drive the app. `noopener` is not passed as a feature because it makes
 * `window.open` return `null` and a blocked popup could no longer be detected.
 *
 * @returns `false` when the browser blocked the new tab.
 */
export const openUrlInNewBrowserTab = (url: string): boolean => {
  const popup = window.open(url, "_blank");
  if (!popup) return false;
  popup.opener = null;
  return true;
};
