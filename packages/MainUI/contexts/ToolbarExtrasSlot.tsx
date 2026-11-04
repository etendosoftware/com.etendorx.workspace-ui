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

"use client";

import { createContext, useContext } from "react";

/**
 * Slot at the end of a tab's toolbar where its table publishes view controls (density, full screen).
 * `isGridVisible` is false while the tab shows only its form, so a hidden table renders nothing there.
 */
export interface ToolbarExtrasSlotValue {
  slot: HTMLElement | null;
  setSlot: (element: HTMLElement | null) => void;
  isGridVisible: boolean;
}

export const ToolbarExtrasSlotContext = createContext<ToolbarExtrasSlotValue>({
  slot: null,
  setSlot: () => {},
  isGridVisible: true,
});

export const useToolbarExtrasSlot = () => useContext(ToolbarExtrasSlotContext);
