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

import { useEffect } from "react";
import { useTabCountsStore } from "@/stores/tabCountsStore";

interface UseTabRecordCountParams {
  /** Key of the tab in the counts store. */
  tabCountKey: string;
  /** Only child tabs show their count, as a badge on the tab strip. */
  isChildTab: boolean;
  /** With several parent records selected a child tab shows no children, so it has no count. */
  hasMultipleParents: boolean;
  isLoading: boolean;
  loadedRecordsCount: number;
}

/** Publishes the record count of a child tab to the tab strip, and clears it while it has no meaning. */
export function useTabRecordCount({
  tabCountKey,
  isChildTab,
  hasMultipleParents,
  isLoading,
  loadedRecordsCount,
}: UseTabRecordCountParams): void {
  const setTabCount = useTabCountsStore((s) => s.setCount);
  const clearTabCount = useTabCountsStore((s) => s.clearCount);

  useEffect(() => {
    if (!isChildTab) return;
    if (hasMultipleParents) {
      clearTabCount(tabCountKey);
      return;
    }
    if (!isLoading) setTabCount(tabCountKey, loadedRecordsCount);
  }, [isChildTab, hasMultipleParents, isLoading, loadedRecordsCount, setTabCount, clearTabCount, tabCountKey]);
}
