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

import type { EntityData } from "@workspaceui/api-client/src/api/types";

export interface SingleRecordAutoSelectInputs {
  /** True while the datasource is fetching; the rule only reacts to settled loads. */
  loading: boolean;
  /** True in grid mode. In form view the grid selection must not drive the URL. */
  isVisible: boolean;
  /**
   * True when the tab's level is not expanded, so `Tab` renders the whole tab inside a `hidden`
   * container. A collapsed child tab still reports `isVisible` (that flag only separates grid pane
   * from form pane *inside* a tab), so it has to be rejected on its own.
   */
  isTabCollapsed: boolean;
  /** The tab's loaded records. */
  records: EntityData[];
  /** True when the page is full, i.e. the result set may hold more than what is loaded. */
  hasMoreRecords: boolean;
  /** Record id already selected for this tab, from the window store. */
  storedSelectedId?: string;
  /** True when the SR / Default Edit Mode path is opening the form for this load. */
  srAutoOpens: boolean;
  /** True while the tab's form is creating a new record. */
  isNewRecordMode: boolean;
  /** True while any grid row is being inline-edited. */
  hasEditingRows: boolean;
  /** Record id this rule last selected, so a manual deselect is not undone. */
  lastAutoSelectedId?: string;
}

export type SingleRecordAutoSelectDecision = { select: false } | { select: true; recordId: string };

/**
 * Decides whether a settled grid load that yielded exactly one record should select it.
 *
 * This is the new-UI equivalent of the fifth branch of classic `OBViewGrid.dataArrived`: an
 * unconditional product behaviour, with no preference behind it, that applies to every window and
 * every tab and runs on every load — opening a window, applying a filter, a manual refresh, and the
 * post-delete refetch all go through it. It is also what makes a deletion *look* like it selects the
 * next record: with two records, deleting one leaves a single-record result set for this rule to act
 * on. With three or more, nothing gets selected, and that matches classic.
 *
 * Guards, in the order classic's `else if` chain resolves them:
 * - a load still in flight, a hidden grid, or an inline edit in progress is not a decision point;
 * - a collapsed tab is not on screen at all, so it must not select either. Classic reaches
 *   `dataArrived` only for a grid the user is looking at, whereas this UI keeps every visited tab
 *   mounted behind a `hidden` container and lets its datasource keep loading, so selecting there
 *   would write a `selectedRecord` for a tab the user never opened;
 * - `hasMoreRecords` stands in for classic's `data.getLength()`, which counts the whole result set:
 *   the datasource always sends `_noCount: "true"`, so no server count is available and a full page
 *   means the single loaded record may not be the only match;
 * - an SR / Default Edit Mode tab has already picked the record (classic branch 4);
 * - a form creating a new record must not have a stale record selected under it;
 * - a record already selected for this tab wins, which is what makes a deep link to a specific
 *   record survive (classic branch 3). Note this compares against the single record rather than
 *   just checking that *some* selection exists: filtering five records down to one leaves a stored
 *   selection pointing outside the result set, and classic resolves its `lastSelectedRecord` branch
 *   *after* this one, so the remaining record must still be selected.
 *
 * @param inputs - the settled state of the load being evaluated
 * @returns the record to select, or `{ select: false }` when an earlier rule owns the decision
 */
export function getSingleRecordAutoSelectDecision(
  inputs: SingleRecordAutoSelectInputs
): SingleRecordAutoSelectDecision {
  if (inputs.loading) return { select: false };
  if (!inputs.isVisible) return { select: false };
  if (inputs.isTabCollapsed) return { select: false };
  if (inputs.hasMoreRecords) return { select: false };
  if (inputs.records.length !== 1) return { select: false };
  if (inputs.srAutoOpens) return { select: false };
  if (inputs.isNewRecordMode) return { select: false };
  if (inputs.hasEditingRows) return { select: false };

  const recordId = String(inputs.records[0].id);
  if (inputs.storedSelectedId === recordId) return { select: false };
  if (inputs.lastAutoSelectedId === recordId) return { select: false };

  return { select: true, recordId };
}
