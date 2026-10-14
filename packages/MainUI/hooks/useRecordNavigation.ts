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
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { logger } from "@/utils/logger";
import type { GuardedTransition } from "@/contexts/UnsavedChangesTabGuard";

/** How long to wait for a fetched page before jumping to the record that follows. */
const FETCH_MORE_SETTLE_MS = 500;

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
  /**
   * Asks the user to save, discard or cancel when the form has unsaved changes, and only
   * then runs the navigation. Replaces the previous silent autosave, which also navigated
   * when the save had failed.
   */
  guardTransition: (transition: GuardedTransition) => void;
  showErrorModal: (message: string) => void;
  hasMoreRecords?: boolean;
  fetchMore?: () => void;
}

export function useRecordNavigation({
  currentRecordId,
  records,
  onNavigate,
  guardTransition,
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

  /** Loads one more page and then moves onto the first record it brought in. */
  const navigateAfterFetchMore = useCallback(
    (currentIndex: number) => {
      if (!fetchMore) {
        return;
      }
      fetchMore();
      setTimeout(() => {
        if (records.length > currentIndex + 1) {
          onNavigate(String(records[currentIndex + 1].id));
        }
      }, FETCH_MORE_SETTLE_MS);
    },
    [fetchMore, records, onNavigate]
  );

  const navigateToNextRecord = useCallback(
    (currentIndex: number) => {
      if (currentIndex === records.length - 1 && hasMoreRecords) {
        navigateAfterFetchMore(currentIndex);
        return;
      }
      if (currentIndex < records.length - 1) {
        onNavigate(String(records[currentIndex + 1].id));
      }
    },
    [records, hasMoreRecords, navigateAfterFetchMore, onNavigate]
  );

  const navigateToPreviousRecord = useCallback(
    (currentIndex: number) => {
      if (currentIndex > 0) {
        onNavigate(String(records[currentIndex - 1].id));
      }
    },
    [records, onNavigate]
  );

  /**
   * Core navigation logic shared between next and previous. Runs only after the
   * unsaved-changes guard let it through.
   */
  const performNavigation = useCallback(
    (direction: "next" | "previous", errorMessage: string) => {
      if (isNavigating) {
        return;
      }

      setIsNavigating(true);

      try {
        const { currentIndex } = navigationState;
        if (direction === "next") {
          navigateToNextRecord(currentIndex);
          return;
        }
        navigateToPreviousRecord(currentIndex);
      } catch (error) {
        logger.error(`Error during ${direction} navigation:`, error);
        showErrorModal(errorMessage);
      } finally {
        setIsNavigating(false);
      }
    },
    [isNavigating, navigationState, navigateToNextRecord, navigateToPreviousRecord, showErrorModal]
  );

  /**
   * Navigates to the next record in the list, asking what to do with unsaved changes first
   */
  const navigateToNext = useCallback(() => {
    if (!navigationState.canNavigateNext) {
      return;
    }
    guardTransition(() => performNavigation("next", "An error occurred while navigating to the next record."));
  }, [navigationState.canNavigateNext, guardTransition, performNavigation]);

  /**
   * Navigates to the previous record in the list, asking what to do with unsaved changes first
   */
  const navigateToPrevious = useCallback(() => {
    if (!navigationState.canNavigatePrevious) {
      return;
    }
    guardTransition(() => performNavigation("previous", "An error occurred while navigating to the previous record."));
  }, [navigationState.canNavigatePrevious, guardTransition, performNavigation]);

  return {
    navigationState,
    navigateToNext,
    navigateToPrevious,
    isNavigating,
  };
}
