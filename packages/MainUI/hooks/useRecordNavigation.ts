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

import { useCallback, useMemo, useState } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { FormState } from "react-hook-form";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { logger } from "@/utils/logger";
import type { SaveOptions } from "@/contexts/ToolbarContext";

export interface NavigationState {
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  currentIndex: number;
  totalRecords: number;
}

interface UseRecordNavigationOptions {
  currentRecordId: string | undefined;
  records: EntityData[];
  onNavigate: (recordId: string) => void;
  formState: FormState<EntityData>;
  handleSave: (options: SaveOptions) => Promise<void>;
  showErrorModal: (message: string) => void;
  hasMoreRecords?: boolean;
  fetchMore?: () => void;
}

export function useRecordNavigation({
  currentRecordId,
  records,
  onNavigate,
  formState,
  handleSave,
  showErrorModal,
  hasMoreRecords = false,
  fetchMore,
}: UseRecordNavigationOptions) {
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * Computes the current navigation state based on record position
   */
  const navigationState: NavigationState = useMemo(() => {
    if (!currentRecordId || currentRecordId === NEW_RECORD_ID || records.length === 0) {
      return {
        canNavigateNext: false,
        canNavigatePrevious: false,
        currentIndex: -1,
        totalRecords: records.length,
      };
    }

    const currentIndex = records.findIndex((record) => String(record.id) === currentRecordId);

    if (currentIndex === -1) {
      return {
        canNavigateNext: false,
        canNavigatePrevious: false,
        currentIndex: -1,
        totalRecords: records.length,
      };
    }

    return {
      canNavigateNext: currentIndex < records.length - 1 || hasMoreRecords,
      canNavigatePrevious: currentIndex > 0,
      currentIndex,
      totalRecords: records.length,
    };
  }, [currentRecordId, records, hasMoreRecords]);

  /**
   * Performs autosave before navigation if there are unsaved changes
   * Returns true if navigation should proceed, false otherwise
   */
  const performAutosaveIfNeeded = useCallback(async (): Promise<boolean> => {
    if (!formState.isDirty) {
      return true; // No changes, proceed with navigation
    }

    try {
      // Autosave with modal showing "Saved" message
      // skipFormStateUpdate: false to allow normal form state updates during navigation
      await handleSave({ showModal: true });
      return true; // Save successful, proceed with navigation
    } catch (error) {
      logger.error("Error during autosave before navigation:", error);
      showErrorModal(
        typeof error === "string" ? error : "Failed to save changes. Please fix the errors before navigating."
      );
      return false; // Save failed, block navigation
    }
  }, [formState.isDirty, handleSave, showErrorModal]);

  /**
   * Core navigation logic shared between next and previous
   */
  const performNavigation = useCallback(
    async (direction: "next" | "previous", errorMessage: string) => {
      if (isNavigating) {
        return;
      }

      setIsNavigating(true);

      try {
        // Check if we need to autosave
        const canProceed = await performAutosaveIfNeeded();
        if (!canProceed) {
          return; // Navigation blocked due to save error
        }

        const { currentIndex } = navigationState;

        if (direction === "next") {
          // If we're at the last record and there are more records to load
          if (currentIndex === records.length - 1 && hasMoreRecords) {
            if (fetchMore) {
              fetchMore();
              // Wait a bit for records to load
              setTimeout(() => {
                if (records.length > currentIndex + 1) {
                  const nextRecord = records[currentIndex + 1];
                  onNavigate(String(nextRecord.id));
                }
              }, 500);
            }
            return;
          }

          // Navigate to next record in current list
          if (currentIndex < records.length - 1) {
            const nextRecord = records[currentIndex + 1];
            onNavigate(String(nextRecord.id));
          }
        } else {
          // Navigate to previous record
          if (currentIndex > 0) {
            const previousRecord = records[currentIndex - 1];
            onNavigate(String(previousRecord.id));
          }
        }
      } catch (error) {
        logger.error(`Error during ${direction} navigation:`, error);
        showErrorModal(errorMessage);
      } finally {
        setIsNavigating(false);
      }
    },
    [
      isNavigating,
      navigationState,
      performAutosaveIfNeeded,
      records,
      hasMoreRecords,
      fetchMore,
      onNavigate,
      showErrorModal,
    ]
  );

  /**
   * Navigates to the next record in the list
   * Automatically saves changes before navigation if needed
   */
  const navigateToNext = useCallback(async () => {
    if (!navigationState.canNavigateNext) {
      return;
    }
    await performNavigation("next", "An error occurred while navigating to the next record.");
  }, [navigationState.canNavigateNext, performNavigation]);

  /**
   * Navigates to the previous record in the list
   * Automatically saves changes before navigation if needed
   */
  const navigateToPrevious = useCallback(async () => {
    if (!navigationState.canNavigatePrevious) {
      return;
    }
    await performNavigation("previous", "An error occurred while navigating to the previous record.");
  }, [navigationState.canNavigatePrevious, performNavigation]);

  return {
    navigationState,
    navigateToNext,
    navigateToPrevious,
    isNavigating,
  };
}
