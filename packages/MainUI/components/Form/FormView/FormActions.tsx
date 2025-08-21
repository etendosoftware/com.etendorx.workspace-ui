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

import { useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useSelected } from "@/hooks/useSelected";
import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { useTabContext } from "@/contexts/tab";
import { globalCalloutManager } from "@/services/callouts";
import { logger } from "@/utils/logger";
import type { Tab } from "@workspaceui/api-client/src/api/types";

interface FormActionsProps {
  tab: Tab;
  setRecordId: (recordId: string) => void;
  refetch: () => Promise<void>;
  onSave: (showModal: boolean) => Promise<void>;
  showErrorModal: (message: string) => void;
}

export function FormActions({ tab, setRecordId, refetch, onSave, showErrorModal }: FormActionsProps) {
  const { formState } = useFormContext();
  const { graph } = useSelected();
  const { activeWindow, clearTabFormState } = useMultiWindowURL();
  const { registerActions, setSaveButtonState } = useToolbarContext();
  const { markFormAsChanged, resetFormChanges } = useTabContext();

  const { validateRequiredFields } = useFormValidation(tab);

  // Update validation state when form data changes
  useEffect(() => {
    const validationResult = validateRequiredFields();
    setSaveButtonState((prev) => ({
      ...prev,
      hasValidationErrors: !validationResult.isValid,
      validationErrors: validationResult.missingFields.map((field) => field.fieldLabel),
    }));

    return () => {
      setSaveButtonState((prev) => ({
        ...prev,
        hasValidationErrors: false,
        isSaving: false,
        validationErrors: [],
      }));
    };
  }, [validateRequiredFields, setSaveButtonState]);

  useEffect(() => {
    if (formState.isDirty) {
      markFormAsChanged();
    }

    return () => {
      resetFormChanges();
    };
  }, [formState.isDirty, markFormAsChanged, resetFormChanges]);

  const handleSave = useCallback(
    async (showModal: boolean) => {
      try {
        // Set saving state
        setSaveButtonState((prev) => ({ ...prev, isSaving: true }));

        // Check if any callouts are currently running
        const globalCalloutState = globalCalloutManager.getState();
        if (globalCalloutState.isRunning) {
          logger.warn("Cannot save while callouts are running");
          return;
        }

        // Perform required field validation
        const validationResult = validateRequiredFields();

        if (!validationResult.isValid) {
          const missingFields = validationResult.missingFields.map((field) => field.fieldLabel).join(", ");
          showErrorModal(`The following required fields are missing: ${missingFields}`);
          return;
        }

        // Proceed with save if validation passes
        await onSave(showModal);
      } catch (error) {
        logger.error("Error during save operation:", error);
      } finally {
        // Clear saving state
        setSaveButtonState((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [onSave, showErrorModal, setSaveButtonState, validateRequiredFields]
  );

  const onReset = useCallback(async () => {
    await refetch();
    resetFormChanges();
  }, [refetch, resetFormChanges]);

  const handleBack = useCallback(() => {
    const windowId = activeWindow?.windowId;
    if (windowId) {
      clearTabFormState(windowId, tab.id);
    }
    graph.clear(tab);
    graph.clearSelected(tab);
    resetFormChanges();
  }, [activeWindow?.windowId, clearTabFormState, graph, tab, resetFormChanges]);

  const handleNew = useCallback(() => {
    setRecordId(NEW_RECORD_ID);
    resetFormChanges();
  }, [setRecordId, resetFormChanges]);

  useEffect(() => {
    const actions = {
      save: handleSave,
      refresh: onReset,
      back: handleBack,
      new: handleNew,
    };

    registerActions(actions);
  }, [registerActions, handleSave, onReset, handleBack, handleNew, tab.id]);

  return null;
}
