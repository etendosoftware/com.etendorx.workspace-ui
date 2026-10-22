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

import type { Column } from "@workspaceui/api-client/src/api/types";
import { LegacyColumnFilterUtils } from "@workspaceui/api-client/src/utils/search-utils";

/**
 * Whether a grid column with a Classic `clientclass` renders as a navigation
 * link (e.g. `SalesOrderTabLink`). A Yes/No column is never a link: its
 * `clientclass` (e.g. `APRMMatchStatGridButtonsComponent`) is a cell component
 * the new UI does not render, so the column keeps its Yes/No cell and filter.
 */
export function isClientclassLinkColumn(column: Column): boolean {
  return Boolean(column.clientclass) && !LegacyColumnFilterUtils.isBooleanField(column);
}
