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

import { getStoredPreference } from "@/utils/propertyStore";

/** Classic messages a grid shows about a filter the user did not set. */
export const FILTER_MESSAGE = {
  /** The default (implicit or transactional) filter of the tab is applied. */
  IMPLICIT: "implicit",
  /** The grid holds only the record opened from a link. */
  SINGLE_RECORD: "singleRecord",
} as const;

export type FilterMessageKind = (typeof FILTER_MESSAGE)[keyof typeof FILTER_MESSAGE];

/** Property List preferences that, set to N, stop showing each message ("Never show this message again"). */
export const FILTER_MESSAGE_PREFERENCES: Record<FilterMessageKind, string> = {
  [FILTER_MESSAGE.IMPLICIT]: "OBUIAPP_ShowImplicitFilterMsg",
  [FILTER_MESSAGE.SINGLE_RECORD]: "OBUIAPP_ShowSingleRecordFilterMsg",
};

/** AD_Message texts of the messages, as classic `ob-grid.js` shows them. */
export const FILTER_MESSAGE_TEXTS = {
  CLEAR_FILTERS: "OBUIAPP_ClearFilters",
  NEVER_SHOW_AGAIN: "OBUIAPP_NeverShowMessageAgain",
  SINGLE_RECORD: "OBUIAPP_SingleRecordFilterMsg",
} as const;

/** Values classic reads as "do not show" (`'N'`, or `'"N"'` as some clients stored it). */
const HIDDEN_VALUES = new Set(["N", '"N"']);

export interface FilterMessageState {
  /** The grid is on screen (not the form). */
  isGridVisible: boolean;
  /** The grid was opened from a link and holds only that record (`directNavigation` in classic). */
  isDirectLink: boolean;
  /** The default filter of the tab is applied. */
  isImplicitFilterApplied: boolean;
  /** Text of the default filter from the metadata (`OBViewGridComponent.getFilterName`); empty when there is none. */
  implicitFilterMessage?: string;
  /** The tab has no parent, or its parent has a selected record. */
  hasParentSelection: boolean;
}

/** Whether the user did not turn the message off ("Never show this message again"). */
export function isFilterMessageEnabled(kind: FilterMessageKind): boolean {
  const value = getStoredPreference(FILTER_MESSAGE_PREFERENCES[kind]);
  return value === undefined || !HIDDEN_VALUES.has(value);
}

/**
 * Message the grid shows, as classic `checkShowFilterFunnelIcon`: nothing while the form is on screen; the
 * single-record message for a grid opened from a link; otherwise the implicit filter message while the
 * default filter is applied and the parent has a record.
 *
 * @param state - What the grid is showing
 * @returns The message to show, or `null`
 */
export function decideFilterMessage(state: FilterMessageState): FilterMessageKind | null {
  if (!state.isGridVisible) {
    return null;
  }
  if (state.isDirectLink) {
    return isFilterMessageEnabled(FILTER_MESSAGE.SINGLE_RECORD) ? FILTER_MESSAGE.SINGLE_RECORD : null;
  }
  const showsImplicitFilter =
    state.isImplicitFilterApplied && Boolean(state.implicitFilterMessage) && state.hasParentSelection;
  if (showsImplicitFilter && isFilterMessageEnabled(FILTER_MESSAGE.IMPLICIT)) {
    return FILTER_MESSAGE.IMPLICIT;
  }
  return null;
}
