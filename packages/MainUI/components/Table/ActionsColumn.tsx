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

import React from "react";
import type { MRT_Row } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
import { useTranslation } from "@/hooks/useTranslation";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { generateAriaAttributes } from "./utils/accessibilityUtils";

// Import icons from ComponentLibrary
import EditIcon from "../../../ComponentLibrary/src/assets/icons/edit.svg";
import CheckIcon from "../../../ComponentLibrary/src/assets/icons/check.svg";
import XIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import ExternalLinkIcon from "../../../ComponentLibrary/src/assets/icons/external-link.svg";
import AlertCircleIcon from "../../../ComponentLibrary/src/assets/icons/alert-circle.svg";

interface ActionsColumnProps {
  /** The table row this actions column belongs to */
  row: MRT_Row<EntityData>;
  /** Whether this row is currently being edited */
  isEditing: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Whether the row has validation errors */
  hasErrors: boolean;
  /** Validation error messages for this row */
  validationErrors?: Record<string, string | undefined>;
  /** Callback to start editing this row */
  onEdit: () => void;
  /** Callback to save changes to this row */
  onSave: () => void;
  /** Callback to cancel editing this row */
  onCancel: () => void;
  /** Callback to open the full form view for this row */
  onOpenForm: () => void;
}

/**
 * ActionsColumn component provides row-level action buttons for inline editing.
 * It conditionally renders different sets of buttons based on the row's editing state:
 * - In read-only mode: Edit and Form View buttons
 * - In edit mode: Save, Cancel buttons, and error indicators
 */
export const ActionsColumn: React.FC<ActionsColumnProps> = ({
  row,
  isEditing,
  isSaving,
  hasErrors,
  validationErrors,
  onEdit,
  onSave,
  onCancel,
  onOpenForm,
}) => {
  const { t } = useTranslation();

  // Create error tooltip content
  const getErrorTooltip = (): string => {
    if (!validationErrors) return "Validation errors present";
    
    const errorMessages = Object.entries(validationErrors)
      .filter(([_, message]) => message)
      .map(([field, message]) => {
        if (field === '_general') {
          return message;
        }
        return `${field}: ${message}`;
      });
    
    if (errorMessages.length === 0) return "Validation errors present";
    
    return errorMessages.join('\n');
  };

  // Check if there are server errors specifically
  const hasServerErrors = validationErrors && Object.values(validationErrors).some(error => 
    error && (error.includes('server') || error.includes('network') || error.includes('constraint'))
  );

  if (isEditing) {
    const saveButtonAttrs = generateAriaAttributes.actionButton(
      "Save", 
      String(row.original.id), 
      isSaving || hasErrors
    );
    const cancelButtonAttrs = generateAriaAttributes.actionButton(
      "Cancel", 
      String(row.original.id), 
      isSaving
    );

    return (
      <div className="flex items-center gap-1 min-w-[80px]" role="group" aria-label="Row editing actions">
        <IconButton
          onClick={onSave}
          disabled={isSaving || hasErrors}
          title={hasErrors ? "Fix validation errors before saving" : "Save"}
          className={`
            ${hasErrors 
              ? "text-gray-400 cursor-not-allowed" 
              : "text-green-600 hover:text-green-800 hover:bg-green-50"
            }
            transition-colors duration-200
          `}
          data-testid={`save-button-${String(row.original.id)}`}
          {...saveButtonAttrs}
        >
          {isSaving ? (
            <LoadingIndicator size="small" inline />
          ) : (
            <CheckIcon className="w-4 h-4" />
          )}
        </IconButton>
        
        <IconButton
          onClick={onCancel}
          disabled={isSaving}
          title="Cancel"
          className="text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-200"
          data-testid={`cancel-button-${String(row.original.id)}`}
          {...cancelButtonAttrs}
        >
          <XIcon className="w-4 h-4" />
        </IconButton>
        
        {hasErrors && (
          <div 
            className={`flex items-center ${hasServerErrors ? 'text-orange-500' : 'text-red-500'}`}
            title={getErrorTooltip()}
            data-testid={`error-indicator-${String(row.original.id)}`}
            role="alert"
            aria-live="assertive"
            aria-label={`Validation errors for row ${String(row.original.id)}`}
          >
            <AlertCircleIcon className="w-4 h-4" />
            {hasServerErrors && (
              <span className="text-xs ml-1 font-medium">SERVER</span>
            )}
          </div>
        )}
      </div>
    );
  }

  const editButtonAttrs = generateAriaAttributes.actionButton(
    "Edit in grid", 
    String(row.original.id)
  );
  const formButtonAttrs = generateAriaAttributes.actionButton(
    "Open form view", 
    String(row.original.id)
  );

  return (
    <div className="flex items-center gap-1 min-w-[80px]" role="group" aria-label="Row actions">
      <IconButton
        onClick={onEdit}
        title="Edit in grid"
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors duration-200"
        data-testid={`edit-button-${String(row.original.id)}`}
        {...editButtonAttrs}
      >
        <EditIcon className="w-4 h-4" />
      </IconButton>
      
      <IconButton
        onClick={onOpenForm}
        title="Open form view"
        className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-200"
        data-testid={`form-button-${String(row.original.id)}`}
        {...formButtonAttrs}
      >
        <ExternalLinkIcon className="w-4 h-4" />
      </IconButton>
    </div>
  );
};