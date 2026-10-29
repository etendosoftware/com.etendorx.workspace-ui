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

import { useCallback } from "react";
import type { DatasourceOptions, Tab } from "@workspaceui/api-client/src/api/types";
import { DEFAULT_TABLE_STATE, useWindowStore } from "@/stores/windowStore";
import { exportGridToCsv } from "@/utils/export/csvExport";

/**
 * The "Export to Spreadsheet" action of a grid: exports the records the grid shows, with its
 * current query (filters, search, sort), so the file always matches the grid.
 *
 * @param tab - Tab of the grid
 * @param windowIdentifier - Window the tab belongs to
 * @param getRequestParams - Params of the grid's current query (`useTableData`)
 */
export function useGridCsvExport({
  tab,
  windowIdentifier,
  getRequestParams,
}: {
  tab: Tab;
  windowIdentifier?: string | null;
  getRequestParams: () => DatasourceOptions;
}): () => Promise<void> {
  return useCallback(async () => {
    if (!windowIdentifier) {
      throw new Error("CSV Export failed: Window context not found");
    }
    const tableState = useWindowStore.getState().windows[windowIdentifier]?.tabs[tab.id]?.table ?? DEFAULT_TABLE_STATE;
    await exportGridToCsv({ tab, tableState, gridParams: getRequestParams() });
  }, [tab, windowIdentifier, getRequestParams]);
}
