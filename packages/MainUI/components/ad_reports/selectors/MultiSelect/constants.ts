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

import type { MRT_ColumnDef } from "material-react-table";
import type { TableData } from "../../../Form/FormView/types";

export const DEFAULT_COLUMNS: MRT_ColumnDef<TableData>[] = [
  {
    header: "ID",
    accessorKey: "id",
  },
  {
    header: "Name",
    accessorKey: "_identifier",
  },
] as const;

export const TABLE_INITIAL_STATE = {
  density: "compact" as const,
  pagination: {
    pageSize: 10,
    pageIndex: 0,
  },
} as const;

export const DIALOG_PROPS = {
  maxWidth: "lg" as const,
  fullWidth: true,
} as const;

export const ICON_BUTTON_SIZE = "small" as const;

export const LOADING_TEXT = "Loading..." as const;
export const EMPTY_STATE_TEXT = "No items selected" as const;
export const ADD_BUTTON_TEXT = "Add" as const;
export const CLOSE_BUTTON_TEXT = "Close" as const;
