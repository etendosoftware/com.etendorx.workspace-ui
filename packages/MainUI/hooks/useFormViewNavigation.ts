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

import { useCallback } from "react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useDatasourceContext } from "@/contexts/datasourceContext";

interface UseFormViewNavigationOptions {
  tab: Tab;
}

/**
 * Hook to provide navigation records for FormView
 * Only provides records if they were already loaded by the Table component
 * This prevents infinite loops and matches classic interface behavior
 * where navigation is only available after viewing the table first
 */
export function useFormViewNavigation({ tab }: UseFormViewNavigationOptions) {
  const { getRecords, getHasMoreRecords, fetchMoreRecords } = useDatasourceContext();

  // Get records from DatasourceContext (only if Table has loaded them)
  const records = getRecords(tab.id);
  const hasMoreRecords = getHasMoreRecords(tab.id);

  const fetchMore = useCallback(() => {
    fetchMoreRecords(tab.id);
  }, [fetchMoreRecords, tab.id]);

  return {
    records,
    hasMoreRecords,
    fetchMore,
  };
}
