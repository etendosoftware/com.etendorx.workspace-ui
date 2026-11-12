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

import type { UIPattern } from "@workspaceui/api-client/src/api/types";
import { UIPattern as UIPatternEnum } from "@workspaceui/api-client/src/api/types";

/** Patterns that forbid creating records from the grid: read-only, edit-only and edit-and-delete-only. */
const CREATION_BLOCKED_PATTERNS: ReadonlySet<string> = new Set([
  UIPatternEnum.READ_ONLY,
  UIPatternEnum.EDIT_ONLY,
  UIPatternEnum.EDIT_AND_DELETE_ONLY,
]);

/**
 * Tells whether the tab pattern forbids creating records. A role's non-editable Tab Access is
 * served as the read-only pattern, so this also covers role restrictions.
 *
 * @param uIPattern - The tab UI pattern
 * @returns `true` when new records cannot be created
 */
export const isRecordCreationBlocked = (uIPattern?: UIPattern): boolean =>
  uIPattern !== undefined && CREATION_BLOCKED_PATTERNS.has(uIPattern);

/**
 * Tells whether the tab pattern forbids editing records (read-only tab).
 *
 * @param uIPattern - The tab UI pattern
 * @returns `true` when records cannot be edited
 */
export const isRecordEditionBlocked = (uIPattern?: UIPattern): boolean => uIPattern === UIPatternEnum.READ_ONLY;
