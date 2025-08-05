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

import { SECONDARY_100, SECONDARY_500, PRIMARY_100 } from "@workspaceui/componentlibrary/src/theme";

export const GRID_CONSTANTS = {
  ITEMS: {
    ERP_SOFTWARE: {
      color: SECONDARY_500,
      fontSize: "2rem",
    },
    TAILORED: {
      color: SECONDARY_100,
      fontSize: "1.5rem",
    },
    HIGHLY_ADAPTABLE: {
      color: SECONDARY_100,
      fontSize: "1.5rem",
    },
    LOGO: {
      color: PRIMARY_100,
    },
  },
  ICONS: {
    TITLE_EMOJI: "✨",
  },
} as const;
