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

import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import { NEW_RECORD_ID } from "@/utils/url/constants";
import { useTabContext } from "@/contexts/tab";
import { globalCalloutManager } from "@/services/callouts";
import { logger } from "@/utils/logger";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useFormInitializationContext } from "@/contexts/FormInitializationContext";
import { useWindowContext } from "@/contexts/window";

interface FormActionsProps {
  tab: Tab;
  onNew: () => void;
  refetch: () => Promise<void>;
  onSave: (showModal: boolean) => Promise<void>;
  showErrorModal: (message: string) => void;
}

export function FormActions({ tab, onNew, refetch, onSave, showErrorModal }: FormActionsProps) {
  const formContext = useFormContext();
  const { isDirty } = formContext.formState;

  const { activeWindow, clearTabFormState } = useWindowContext();
  const { registerActions, setSaveButtonState } = useToolbarContext();
  const { markFormAsChanged, resetFormChanges } = useTabContext();
  const { isFormInitializing } = useFormInitializationContext();

  const { validateRequiredFields } = useFormValidation(tab);
  const [hasValidatedInitialLoad, setHasValidatedInitialLoad] = useState(false);

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
    if (isDirty) {
      markFormAsChanged();
    } else {
      resetFormChanges();
    }
  }, [isDirty, markFormAsChanged, resetFormChanges]);

  useEffect(() => {
    if (isFormInitializing) {
      return;
    }

    // Wait for all callouts to finish
    const calloutState = globalCalloutManager.getState();
    if (calloutState.isRunning || calloutState.queueLength > 0 || calloutState.pendingCount > 0) {
      // If callouts are running, mark that we haven't validated yet
      if (hasValidatedInitialLoad) {
        setHasValidatedInitialLoad(false);
      }
      return;
    }

    // If we already validated and callouts are done, don't validate again
    if (hasValidatedInitialLoad) {
      return;
    }

    // Form is completely loaded, validate if save button should be enabled
    const timer = setTimeout(() => {
      const shouldEnableSave = isDirty || validateRequiredFields().isValid;
      shouldEnableSave ? markFormAsChanged() : resetFormChanges();
      setHasValidatedInitialLoad(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [
    isFormInitializing,
    isDirty,
    markFormAsChanged,
    resetFormChanges,
    hasValidatedInitialLoad,
    validateRequiredFields,
  ]);

  // Reset validation flag when form is re-initialized (e.g., navigating to a different record)
  useEffect(() => {
    if (isFormInitializing) {
      setHasValidatedInitialLoad(false);
    }
  }, [isFormInitializing]);

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
    const windowIdentifier = activeWindow?.windowIdentifier;
    if (windowIdentifier) {
      clearTabFormState(windowIdentifier, tab.id);
    }
    resetFormChanges();
  }, [activeWindow?.windowIdentifier, clearTabFormState, tab, resetFormChanges]);

  const handleNew = useCallback(() => {
    onNew();
  }, [onNew]);

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
