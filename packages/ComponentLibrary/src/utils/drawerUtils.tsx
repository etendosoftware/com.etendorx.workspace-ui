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

import type { Menu } from "@workspaceui/api-client/src/api/types";

export const findActive = (windowId: string | undefined, items: Menu[] | undefined = []): boolean => {
  if (!items || !windowId) return false;
  const stack: Menu[] = [...items];
  while (stack.length > 0) {
    const item = stack.pop();
    if (item) {
      if (item.windowId === windowId) return true;
      if (item.children) stack.push(...item.children);
    }
  }
  return false;
};

/**
 * Keyboard navigation of the menu list.
 *
 * A node takes part in the navigation when clicking it does something: a folder that can
 * be expanded, or a leaf that can be opened. The set of expanded nodes is not knowable
 * from the Drawer — the top level lives in `Sidebar` while the nested levels live in the
 * local state of each `DrawerSection` — so the visible order is read from the DOM, which
 * is the only consistent view of what is on screen.
 */

/** Marks a menu entry that takes part in the keyboard navigation, with its item id. */
export const MENU_ITEM_ID_ATTRIBUTE = "data-menu-item-id";

/** Marks the children container of a collapsed section, whose entries are not reachable. */
export const MENU_COLLAPSED_ATTRIBUTE = "data-menu-collapsed";

/** Menu item types the drawer knows how to open — mirrors the dispatch of `useItemActions`. */
export const OPENABLE_MENU_ITEM_TYPES = [
  "Window",
  "View",
  "Report",
  "ProcessDefinition",
  "Form",
  "Process",
  "ProcessManual",
] as const;

/** Offsets accepted by {@link findAdjacentMenuItem}. */
export const MENU_NAVIGATION_OFFSETS = {
  NEXT: 1,
  PREVIOUS: -1,
} as const;

export type MenuNavigationOffset = (typeof MENU_NAVIGATION_OFFSETS)[keyof typeof MENU_NAVIGATION_OFFSETS];

const MENU_ITEM_SELECTOR = `[${MENU_ITEM_ID_ATTRIBUTE}]`;
const COLLAPSED_SUBTREE_SELECTOR = `[${MENU_COLLAPSED_ATTRIBUTE}]`;

/**
 * Whether clicking this item opens something. A `Window` needs its `windowId`, every
 * other openable type needs its `id`; a folder (`Summary`) is never openable.
 */
export const isOpenableMenuItem = (item: Menu): boolean => {
  const type = item.type ?? "";
  if (!OPENABLE_MENU_ITEM_TYPES.includes(type as (typeof OPENABLE_MENU_ITEM_TYPES)[number])) return false;
  if (type === "Window") return Boolean(item.windowId);
  return Boolean(item.id);
};

/**
 * Menu entries reachable with the arrows, in DOM order — which is the order they are
 * shown in. Entries inside a collapsed section are left out.
 *
 * Visibility is decided through the collapsed marker rather than through layout
 * (`offsetParent`, `getBoundingClientRect`), which jsdom does not compute.
 */
export const findNavigableMenuItems = (root: HTMLElement | null | undefined): HTMLElement[] => {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)).filter(
    (element) => !element.closest(COLLAPSED_SUBTREE_SELECTOR)
  );
};

/** The entry currently highlighted, or null when it is no longer on screen. */
export const findHighlightedMenuItem = (
  root: HTMLElement | null | undefined,
  highlightedItemId: string | null
): HTMLElement | null => {
  if (!highlightedItemId) return null;
  const items = findNavigableMenuItems(root);
  return items.find((element) => element.getAttribute(MENU_ITEM_ID_ATTRIBUTE) === highlightedItemId) ?? null;
};

/**
 * Neighbour of the highlighted entry, stopping at both ends rather than wrapping around,
 * as the grids of Etendo Classic do.
 *
 * When the current id is no longer in the list — the search changed under the user, or
 * nothing was highlighted yet — the first entry is returned, which is the natural start
 * of an arrow-down.
 */
export const findAdjacentMenuItem = (
  items: HTMLElement[],
  highlightedItemId: string | null,
  offset: MenuNavigationOffset
): HTMLElement | null => {
  if (items.length === 0) return null;

  const currentIndex = items.findIndex((element) => element.getAttribute(MENU_ITEM_ID_ATTRIBUTE) === highlightedItemId);
  if (currentIndex === -1) return items[0];

  const nextIndex = currentIndex + offset;
  if (nextIndex < 0 || nextIndex >= items.length) return items[currentIndex];
  return items[nextIndex];
};

/** Id of an entry, as read back from the DOM. */
export const getMenuItemId = (element: HTMLElement | null): string | null => {
  return element?.getAttribute(MENU_ITEM_ID_ATTRIBUTE) ?? null;
};
