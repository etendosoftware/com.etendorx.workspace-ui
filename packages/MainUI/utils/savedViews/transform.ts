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

import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";
import type { ClassicViewConfig, MRTViewConfig, RawSavedViewRecord, SavedView } from "./types";

/**
 * Guards whether a parsed JSON value is a valid MRTViewConfig.
 */
function isMRTViewConfig(value: unknown): value is MRTViewConfig {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && v.source === "workspace-ui";
}

/**
 * Parses a JSON string into an MRTViewConfig.
 * Returns null if the string is empty, unparseable, or not in the workspace-ui format.
 * Falls back gracefully on Classic format (returns null — caller decides what to do).
 */
export function parseGridConfiguration(raw: string): MRTViewConfig | null {
  if (!raw || raw.trim() === "") return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isMRTViewConfig(parsed)) {
      return parsed;
    }

    // Classic format — we can partially adapt but return null to signal no MRT config
    return null;
  } catch {
    return null;
  }
}

/**
 * Converts current MRT table state into a JSON string suitable for `gridConfiguration`.
 */
export function buildGridConfiguration(
  filters: MRT_ColumnFiltersState,
  visibility: MRT_VisibilityState,
  sorting: MRT_SortingState,
  order: string[]
): string {
  const config: MRTViewConfig = {
    version: 1,
    source: "workspace-ui",
    filters,
    visibility,
    sorting,
    order,
  };
  return JSON.stringify(config);
}

/**
 * Attempts to parse a Classic-format gridConfiguration for display-only purposes.
 * Returns null if parsing fails or if the format is not Classic.
 */
export function parseClassicGridConfiguration(raw: string): ClassicViewConfig | null {
  if (!raw || raw.trim() === "") return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") return null;

    // Classic format has `fields` or `criteria` arrays, but NOT version/source
    const v = parsed as Record<string, unknown>;
    if (v.version !== undefined && v.source !== undefined) return null;

    return parsed as ClassicViewConfig;
  } catch {
    return null;
  }
}

/**
 * Maps a raw datasource record to a normalized SavedView shape.
 */
export function rawRecordToSavedView(record: RawSavedViewRecord): SavedView {
  return {
    id: record.id,
    name: String(record.name ?? ""),
    tabId: String(record.obuiappTab ?? ""),
    isDefault: Boolean(record.obuiappIsdefault ?? false),
    filterClause: String(record.obuiappFilterclause ?? ""),
    gridConfiguration: String(record.obuiappGridconfiguration ?? ""),
  };
}
