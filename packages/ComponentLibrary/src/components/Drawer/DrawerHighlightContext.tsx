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

import { createContext, useContext } from "react";

export interface DrawerHighlightContextType {
  /** Id of the menu entry the keyboard navigation is currently on. */
  highlightedItemId: string | null;
}

/**
 * Tells each menu entry whether it is the one highlighted by the keyboard.
 *
 * A context rather than a prop because `DrawerSection` is recursive and memoised:
 * threading the id down would invalidate the memo of every section on each arrow press,
 * while a context only re-renders the entries themselves.
 *
 * It is provided around the menu list alone. `RecentlyViewed` renders its own sections
 * with the same items, and would otherwise highlight a duplicate of the entry.
 */
export const DrawerHighlightContext = createContext<DrawerHighlightContextType | undefined>(undefined);

export function useDrawerHighlight(): DrawerHighlightContextType | undefined {
  return useContext(DrawerHighlightContext);
}
