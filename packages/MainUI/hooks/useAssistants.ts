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
import { useState, useCallback, useMemo } from "react";
import { useCopilotClient } from "./useCopilotClient";

export const useAssistants = () => {
  const [selectedOption, setSelectedOption] = useState<IAssistant | null>(null);
  const [assistants, setAssistants] = useState<IAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(true);

  const copilotClient = useCopilotClient();

  const getAssistants = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await copilotClient.getAssistants();

      if (data.length > 0) {
        // Sort: featured "Y" first, then the rest
        const sorted = [...data].sort((a, b) => {
          if (a.featured === "Y" && b.featured !== "Y") return -1;
          if (a.featured !== "Y" && b.featured === "Y") return 1;
          return 0;
        });
        setSelectedOption(sorted[0]);
        setAssistants(sorted);
      } else {
        setSelectedOption(null);
        setAssistants([]);
      }
    } catch (error) {
      console.error("Error loading assistants:", error);
      setSelectedOption(null);
      setAssistants([]);
    } finally {
      setIsLoading(false);
    }
  }, [copilotClient]);

  // Filtered list: when showOnlyFeatured is true, only show assistants with featured "Y"
  // If none have featured "Y", fall back to showing all
  const filteredAssistants = useMemo(() => {
    if (!showOnlyFeatured) return assistants;
    const featured = assistants.filter((a: IAssistant) => a.featured === "Y");
    return featured.length > 0 ? featured : assistants;
  }, [assistants, showOnlyFeatured]);

  const hasFeaturedAssistants = useMemo(
    () => assistants.some((a: IAssistant) => a.featured === "Y"),
    [assistants]
  );

  const clearFeaturedFilter = useCallback(() => {
    setShowOnlyFeatured(false);
  }, []);

  const resetFeaturedFilter = useCallback(() => {
    setShowOnlyFeatured(true);
  }, []);

  const toggleFeaturedFilter = useCallback(() => {
    setShowOnlyFeatured((prev) => !prev);
  }, []);

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
    filteredAssistants,
    hasFeaturedAssistants,
    showOnlyFeatured,
    clearFeaturedFilter,
    resetFeaturedFilter,
    toggleFeaturedFilter,
    getAssistants,
    invalidateCache,
    handleOptionSelected,
    hasAssistants: assistants.length > 0,
    isReady: copilotClient.isReady,
    isLoading,
  };
};
