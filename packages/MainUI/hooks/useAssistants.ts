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

import type { IAssistant } from "@workspaceui/api-client/src/api/copilot";
import { useState, useCallback } from "react";
import { useCopilotClient } from "./useCopilotClient";

export const useAssistants = () => {
  const [selectedOption, setSelectedOption] = useState<IAssistant | null>(null);
  const [assistants, setAssistants] = useState<IAssistant[]>([]);

  const copilotClient = useCopilotClient();

  const getAssistants = useCallback(async () => {
    try {
      const data = await copilotClient.getAssistants();

      if (data.length > 0) {
        setSelectedOption(data[0]);
        setAssistants(data);
      } else {
        setSelectedOption(null);
        setAssistants([]);
      }
    } catch (error) {
      console.error("Error loading assistants:", error);
      setSelectedOption(null);
      setAssistants([]);
    }
  }, [copilotClient]);

  const invalidateCache = useCallback(() => {
    setAssistants([]);
    setSelectedOption(null);
  }, []);

  const handleOptionSelected = useCallback((value: IAssistant | null) => {
    setSelectedOption(value);
  }, []);

  return {
    selectedOption,
    assistants,
    getAssistants,
    invalidateCache,
    handleOptionSelected,
    hasAssistants: assistants.length > 0,
    isReady: copilotClient.isReady,
  };
};
