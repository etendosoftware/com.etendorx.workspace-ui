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

import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import type { LiveTabValues } from "@/stores/liveTabValuesStore";
import type { EvaluationContext, EvaluationContextOptions } from "@/utils/evaluation/buildEvaluationContext";
import { mergeDefinedValues } from "@/utils/expressions/mergeLiveValues";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { toClassicBoolean } from "@/utils/toClassicBoolean";
import { getTabDisplayLogic } from "@/utils/tabUtils";
import { logger } from "@/utils/logger";

/** What one ancestor tab contributes to the display logic of the tabs below it. */
export interface AncestorSnapshot {
  tab: Tab;
  /** Selected record of the tab, with the unsaved values its form is showing on top. */
  values?: Record<string, unknown>;
  /** Auxiliary inputs and session attributes the server computed for that same record. */
  auxiliaryInputs?: Record<string, unknown>;
}

/** Values of the entry when it belongs to the given record; values of any other record never leak. */
const valuesForRecord = (
  entry: LiveTabValues | undefined,
  record: EntityData | undefined
): Record<string, unknown> | undefined => {
  if (!record || entry?.recordId !== String(record.id)) {
    return undefined;
  }
  return entry.values;
};

/**
 * Selected record of a tab with the live values its form publishes on top, when they were
 * published for that same record.
 */
export const overlayLiveValues = (
  record: EntityData | undefined,
  liveEntry: LiveTabValues | undefined
): Record<string, unknown> | undefined => {
  const liveValues = valuesForRecord(liveEntry, record);
  if (!liveValues) {
    return record;
  }
  return mergeDefinedValues(record, liveValues);
};

/** Snapshot of an ancestor tab from its selected record and the entries published for it. */
export const toAncestorSnapshot = (
  tab: Tab,
  record: EntityData | undefined,
  liveEntry: LiveTabValues | undefined,
  selectionEntry: LiveTabValues | undefined
): AncestorSnapshot => ({
  tab,
  values: overlayLiveValues(record, liveEntry),
  auxiliaryInputs: valuesForRecord(selectionEntry, record),
});

/** One property of every snapshot merged from the root down, so the closest ancestor wins. */
const mergeFromRoot = <T>(
  snapshots: AncestorSnapshot[],
  pick: (snapshot: AncestorSnapshot) => Record<string, T> | undefined
): Record<string, T> => {
  const merged: Record<string, T> = {};
  for (const snapshot of [...snapshots].reverse()) {
    Object.assign(merged, pick(snapshot));
  }
  return merged;
};

/**
 * Evaluation options for the display logic of the tabs below the first snapshot, built like Classic's
 * `getContextInfo`: the direct parent's values on top of every other ancestor's, the auxiliary inputs
 * of all of them, the session and, for bare names nothing else defines, the user's preferences.
 *
 * @param snapshots - Ancestor tabs from the direct parent up to the root.
 * @param session - Global session attributes.
 * @param windowId - AD window id, to resolve window-scoped preferences.
 */
export const buildTabDisplayLogicOptions = (
  snapshots: AncestorSnapshot[],
  session: Record<string, unknown>,
  windowId: string | undefined
): EvaluationContextOptions => {
  const [parent, ...ancestors] = snapshots;
  return {
    values: parent?.values,
    fields: parent?.tab.fields,
    parentValues: mergeFromRoot(ancestors, (snapshot) => snapshot.values),
    parentFields: mergeFromRoot(ancestors, (snapshot) => snapshot.tab.fields),
    auxiliaryInputs: mergeFromRoot(snapshots, (snapshot) => snapshot.auxiliaryInputs),
    context: session,
    windowId,
    resolveUnprefixedPreferences: true,
  };
};

/**
 * Whether a tab's display logic lets it show in the given context.
 *
 * @param fallback - Result when the expression cannot be evaluated.
 */
export const isTabDisplayed = (tab: Tab, context: EvaluationContext, fallback: boolean): boolean => {
  const expression = getTabDisplayLogic(tab);
  if (!expression) {
    return true;
  }
  try {
    return toClassicBoolean(compileExpression(expression)(context, context, tab.window));
  } catch (error) {
    logger.error(`Error evaluating display logic for tab ${tab.name}:`, error);
    return fallback;
  }
};
