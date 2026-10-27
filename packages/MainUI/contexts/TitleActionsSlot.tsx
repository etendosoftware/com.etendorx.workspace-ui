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
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { useWindowStore } from "@/stores/windowStore";

/** DOM nodes of the top bar the active window fills: breadcrumb, the record count next to it, record pagination and the footer selection counter. */
export interface TopBarSlots {
  title: HTMLElement | null;
  titleSuffix: HTMLElement | null;
  footer: HTMLElement | null;
  pagination: HTMLElement | null;
}

const EMPTY_SLOTS: TopBarSlots = { title: null, titleSuffix: null, footer: null, pagination: null };

export const TopBarSlotsContext = createContext<TopBarSlots>(EMPTY_SLOTS);

/**
 * Slots of the top bar, or all-null when the calling window is not the active one: several
 * windows stay mounted at once and only the visible one may render into the shared bar.
 */
export const useTopBarSlots = (): TopBarSlots => {
  const slots = useContext(TopBarSlotsContext);
  const windowIdentifier = useCurrentWindowIdentifier();
  const isActive = useWindowStore((s) => (windowIdentifier ? s.windows[windowIdentifier]?.isActive === true : false));
  return isActive ? slots : EMPTY_SLOTS;
};
