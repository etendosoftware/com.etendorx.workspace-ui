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

import { buildPayloadByInputName } from "@/utils";
import { logger } from "@/utils/logger";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { EntityData, FormInitializationResponse, Tab } from "@workspaceui/api-client/src/api/types";
import { useCallback } from "react";
import { useUserContext } from "./useUserContext";
import { buildSessionAttributes } from "@/utils/hooks/useFormInitialization/utils";

const ACTION = "org.openbravo.client.application.window.FormInitializationComponent";
const MODE = "SETSESSION";

export const useSetSession = () => {
  const { setSession } = useUserContext();

  return useCallback(
    async (record: EntityData, tab: Tab) => {
      if (!tab) return;

      const params = new URLSearchParams({
        _action: ACTION,
        MODE,
        TAB_ID: tab.id,
        ROW_ID: String(record.id),
        PARENT_ID: "null",
      });

      try {
        const payload = buildPayloadByInputName(record, tab.fields);
        const response = await Metadata.kernelClient.post(`?${params}`, payload);

        if (!response?.ok) {
          throw new Error(response.statusText);
        }

        const data = response.data as FormInitializationResponse;
        const sessionAttributes = buildSessionAttributes(data);

        setSession((prev) => ({
          ...prev,
          ...sessionAttributes,
        }));
      } catch (error) {
        logger.warn(error);
      }
    },
    [setSession]
  );
};
