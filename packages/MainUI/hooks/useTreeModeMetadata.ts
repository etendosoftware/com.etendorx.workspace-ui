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

import { useMemo } from "react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { getTreeMetadata } from "@/utils/table/treeMode";

/**
 * Tree mode configuration of a tab, derived exclusively from the metadata emitted by the adapter.
 */
export function useTreeModeMetadata(tab: Tab) {
  return useMemo(() => ({ treeMetadata: getTreeMetadata(tab) }), [tab]);
}
