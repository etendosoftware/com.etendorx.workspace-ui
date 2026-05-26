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

import type { ProcessDefinition, ProcessParameter, Tab } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

export const PICK_AND_EXECUTE_UI_PATTERN = "OBUIAPP_PickAndExecute";

const WINDOW_REFERENCE_REFERENCE_ID = FIELD_REFERENCE_CODES.WINDOW.id;

const hasWindowReferenceParameter = (process: ProcessDefinition): boolean => {
  const params = Object.values(process.parameters ?? {}) as ProcessParameter[];
  return params.some((p) => p?.reference === WINDOW_REFERENCE_REFERENCE_ID);
};

/**
 * True iff the process should render with the Pick and Execute layout
 * (filter header + selectable grid body + Execute footer).
 *
 * Primary signal: explicit `uiPattern === "OBUIAPP_PickAndExecute"`.
 * Fallback: presence of a Window Reference parameter — covers seeds where
 * `uiPattern` is missing on OBUIAPP_PROCESS but the embedded grid is.
 */
export const isPickAndExecute = (process: ProcessDefinition | null | undefined): boolean => {
  if (!process) return false;
  if (process.uIPattern === PICK_AND_EXECUTE_UI_PATTERN) return true;
  return hasWindowReferenceParameter(process);
};

/**
 * Normalizes the legacy `boolean | "Y" | "N"` shape emitted by the converter.
 * Default `true` matches Etendo Classic semantics: most P&E processes are
 * multi-record unless the seed explicitly says otherwise.
 *
 * NOTE: this flag controls execution behaviour (whether the handler receives
 * one or many record IDs), NOT grid selection. Use `tabAllowsMultipleSelection`
 * to drive the grid's row-selection mode.
 */
export const allowsMultipleRecords = (process: ProcessDefinition | null | undefined): boolean => {
  if (!process) return true;
  const flag = process.isMultiRecord;
  if (typeof flag === "boolean") return flag;
  if (typeof flag === "string") return flag === "Y";
  return true;
};

/**
 * Returns whether the P&E embedded grid should allow selecting multiple rows.
 * Reads `tab.obuiappSelectionType`, mirroring the classic UI behaviour:
 *   "S" → single-select, "N" → no selection (treated as single here),
 *   "M" or absent → multi-select (default).
 */
export const tabAllowsMultipleSelection = (tab: Tab | null | undefined): boolean => {
  const sel = tab?.obuiappSelectionType;
  return sel !== "S" && sel !== "N";
};
