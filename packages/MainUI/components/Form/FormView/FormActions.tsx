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

import { useCallback, useEffect, useState, useMemo } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useFormContext, useWatch } from "react-hook-form";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import type { SaveOptions } from "@/contexts/ToolbarContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useTabContext } from "@/contexts/tab";
import { globalCalloutManager } from "@/services/callouts";
import { logger } from "@/utils/logger";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useFormInitializationContext } from "@/contexts/FormInitializationContext";
import { useWindowContext } from "@/contexts/window";
import { FormMode } from "@workspaceui/api-client/src/api/types";

interface FormActionsProps {
  tab: Tab;
  onNew: () => void;
  refetch: () => Promise<void>;
  onSave: (options: SaveOptions) => Promise<boolean>;
  showErrorModal: (message: string) => void;
  mode: FormMode;
  isFocused?: boolean;
}

export function FormActions({ tab, onNew, refetch, onSave, showErrorModal, mode, isFocused }: FormActionsProps) {
  const formContext = useFormContext();
  const { isDirty } = formContext.formState;

  const { activeWindow, clearTabFormState } = useWindowContext();
  const { registerActions, setSaveButtonState, saveButtonState } = useToolbarContext();
  const { markFormAsChanged, resetFormChanges } = useTabContext();
  const { isFormInitializing, isSettingInitialValues } = useFormInitializationContext();

  const { validateRequiredFields, requiredFields } = useFormValidation(tab);

  // Get required field names to watch for changes
  const requiredFieldNames = useMemo(() => requiredFields.map((f) => f.hqlName), [requiredFields]);

  // Watch only the required fields to re-validate when they change
  const requiredValues = useWatch({ name: requiredFieldNames });

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
    if (isFormInitializing || isSettingInitialValues) {
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

    // If we already validated and callouts are done, don't validate again unless required values change
    if (hasValidatedInitialLoad && !requiredValues) {
      return;
    }

    // Form is completely loaded, validate if save button should be enabled
    const validationResult = validateRequiredFields();

    const shouldEnableSave = isDirty || (mode === FormMode.NEW && validationResult.isValid);
    shouldEnableSave ? markFormAsChanged() : resetFormChanges();
    setHasValidatedInitialLoad(true);
  }, [
    isFormInitializing,
    isSettingInitialValues,
    isDirty,
    mode,
    markFormAsChanged,
    resetFormChanges,
    hasValidatedInitialLoad,
    validateRequiredFields,
    requiredValues,
    mode,
  ]);

  // Reset validation flag when form is re-initialized (e.g., navigating to a different record)
  useEffect(() => {
    if (isFormInitializing) {
      setHasValidatedInitialLoad(false);
    }
  }, [isFormInitializing]);

  const handleSave = useCallback(
    async (options: SaveOptions): Promise<boolean> => {
      try {
        // Set saving state
        setSaveButtonState((prev) => ({ ...prev, isSaving: true }));

        // Wait if any callouts are currently running
        const globalCalloutState = globalCalloutManager.getState();
        if (globalCalloutState.isRunning || globalCalloutState.pendingCount > 0 || globalCalloutState.queueLength > 0) {
          logger.info("Waiting for callouts to finish before saving...");
          await globalCalloutManager.waitForIdle();
        }

        // Perform required field validation
        const validationResult = validateRequiredFields();

        if (!validationResult.isValid) {
          const missingFields = validationResult.missingFields.map((field) => field.fieldLabel).join(", ");
          showErrorModal(`The following required fields are missing: ${missingFields}`);
          return false;
        }

        // Proceed with save if validation passes
        const succeeded = await onSave(options);
        return succeeded;
      } catch (error) {
        logger.error("Error during save operation:", error);
        return false;
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

  const handleKeyboardSave = useCallback(async () => {
    if (saveButtonState.isSaving || saveButtonState.isCalloutLoading) return;
    await handleSave({ showModal: true });
  }, [handleSave, saveButtonState.isSaving, saveButtonState.isCalloutLoading]);

  const handleKeyboardEscape = useCallback(async () => {
    if (saveButtonState.isSaving || saveButtonState.isCalloutLoading) return;
    if (isDirty) {
      const saved = await handleSave({ showModal: false });
      if (!saved) return;
    }
    handleBack();
  }, [isDirty, handleSave, handleBack, saveButtonState.isSaving, saveButtonState.isCalloutLoading]);

  useKeyboardShortcuts(
    {
      "ctrl+s": { handler: handleKeyboardSave, allowInInputs: true },
      "ctrl+n": { handler: handleNew, allowInInputs: true },
      Escape: { handler: handleKeyboardEscape },
    },
    isFocused ?? true
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: actions need to change every Tab change
  useEffect(() => {
    const actions = {
      save: handleSave,
      refresh: onReset,
      back: handleBack,
      new: handleNew,
    };

    registerActions(actions);
  }, [registerActions, handleSave, onReset, handleBack, handleNew]);

  return null;
}
