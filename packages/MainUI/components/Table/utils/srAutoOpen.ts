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

import type { EntityData, Tab, UIPattern } from "@workspaceui/api-client/src/api/types";
import { UIPattern as UIPatternEnum } from "@workspaceui/api-client/src/api/types";
import { isSrOneToOneExtension } from "@/utils/window/utils";

export const ROOT_TRACKING_KEY = "__root__";

export interface SrAutoOpenInputs {
  uIPattern?: UIPattern;
  tab: Tab;
  loading: boolean;
  displayRecords: EntityData[];
  parentTab?: Tab | null;
  parentRecord?: { id?: string | number } | null;
}

export type SrAutoOpenDecision = { open: false } | { open: true; recordId: string; trackingKey: string };

/**
 * Decide whether to auto-open FormView for a Single Record (SR) tab.
 *
 * Covers two cases Tab.tsx's 1:1 auto-open does not:
 *   - Logical SR (PK != FK): the parent-selected id is not a valid child id, so we
 *     resolve from fetched records.
 *   - Root SR (no parent): isSrOneToOneExtension returns true on empty parentColumns
 *     and Tab.tsx requires parentSelectedRecordId, so neither path opens the form.
 *
 * 1:1 ID-extension WITH parent is intentionally skipped — Tab.tsx handles it.
 *
 * Returned `trackingKey` is the parent record id (or ROOT_TRACKING_KEY for root SR)
 * — callers should remember it across renders so the auto-open fires once per parent.
 */
export function getSrAutoOpenDecision(inputs: SrAutoOpenInputs): SrAutoOpenDecision {
  const { uIPattern, tab, loading, displayRecords, parentTab, parentRecord } = inputs;

  if (uIPattern !== UIPatternEnum.EDIT_ONLY) return { open: false };
  if (!tab.defaultEditMode) return { open: false };
  if (loading) return { open: false };
  if (displayRecords.length === 0) return { open: false };
  if (parentTab && isSrOneToOneExtension(tab)) return { open: false };
  if (parentTab && !parentRecord?.id) return { open: false };

  const trackingKey = parentRecord?.id ? String(parentRecord.id) : ROOT_TRACKING_KEY;
  return { open: true, recordId: String(displayRecords[0].id), trackingKey };
}
