/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may not use this file except in compliance with the License at
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
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { CellEditorProps } from "../types/inlineEditing";
import { TextCellEditor } from "./TextCellEditor";
import { SelectCellEditor } from "./SelectCellEditor";
import { DateCellEditor } from "./DateCellEditor";
import { BooleanCellEditor } from "./BooleanCellEditor";
import { NumericCellEditor } from "./NumericCellEditor";
import { TableDirCellEditor } from "./TableDirCellEditor";
import { generateAriaAttributes } from "../utils/accessibilityUtils";

/**
 * Props for the CellEditorFactory component
 */
export interface CellEditorFactoryProps extends CellEditorProps {
  fieldType: FieldType;
  rowId?: string;
  columnId?: string;
  keyboardNavigationManager?: any; // KeyboardNavigationManager type
  shouldAutoFocus?: boolean; // Controls whether this cell should receive initial focus
}

/**
 * Factory component that determines which editor to render based on field type
 * Provides consistent API across all editor types and handles error states
 * Memoized for performance optimization
 */
const CellEditorFactoryComponent: React.FC<CellEditorFactoryProps> = ({
  fieldType,
  rowId,
  columnId,
  keyboardNavigationManager,
  shouldAutoFocus = false,
  ...editorProps
}) => {
  // Debug logging to track which editor is being used
  console.log(`[CellEditorFactory] Rendering editor for field ${editorProps.field.name}`, {
    fieldType,
    fieldName: editorProps.field.name,
    hasRefList: !!editorProps.field.refList,
    refListLength: editorProps.field.refList?.length || 0,
    referencedEntity: editorProps.field.referencedEntity,
  });

  // Get error message for tooltip display
  const errorMessage = editorProps.hasError ? 'Validation error' : '';

  // Handle error states - if disabled due to errors, show appropriate feedback
  if (editorProps.disabled && editorProps.hasError) {
    return (
      <div className="inline-edit-error-container">
        <span className="inline-edit-error-text">
          Validation error - please fix before editing
        </span>
      </div>
    );
  }

  // Enhanced editor props with keyboard navigation and focus control
  const enhancedEditorProps = {
    ...editorProps,
    rowId,
    columnId,
    keyboardNavigationManager,
    shouldAutoFocus
  };

  // Wrap editor in container with error feedback
  const renderEditor = () => {
    switch (fieldType) {
      case FieldType.TEXT:
        return <TextCellEditor {...enhancedEditorProps} />;
      
      case FieldType.NUMBER:
      case FieldType.QUANTITY:
        return <NumericCellEditor {...enhancedEditorProps} />;
      
      case FieldType.DATE:
      case FieldType.DATETIME:
        return <DateCellEditor {...enhancedEditorProps} />;
      
      case FieldType.BOOLEAN:
        return <BooleanCellEditor {...enhancedEditorProps} />;
      
      case FieldType.LIST:
      case FieldType.SELECT:
        return <SelectCellEditor {...enhancedEditorProps} />;
      
      case FieldType.TABLEDIR:
        // Use specialized TableDirCellEditor for TABLEDIR fields with dynamic option loading
        return <TableDirCellEditor {...enhancedEditorProps} />;
      
      case FieldType.SEARCH:
        // Use SelectCellEditor for SEARCH fields
        return <SelectCellEditor {...enhancedEditorProps} />;
      
      default:
        // Fallback to text editor for unknown field types
        return <TextCellEditor {...enhancedEditorProps} />;
    }
  };

  // Generate ARIA attributes for error messages
  const errorAttributes = editorProps.hasError 
    ? generateAriaAttributes.errorMessage(editorProps.field.name)
    : {};

  return (
    <div className={`cell-editor-wrapper ${editorProps.hasError ? 'cell-validation-error' : ''}`}>
      {renderEditor()}
      {editorProps.hasError && errorMessage && (
        <div 
          className="cell-error-tooltip" 
          {...errorAttributes}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
};

// Memoize the component for performance optimization
export const CellEditorFactory = React.memo(CellEditorFactoryComponent, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.fieldType === nextProps.fieldType &&
    prevProps.value === nextProps.value &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.rowId === nextProps.rowId &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.field.name === nextProps.field.name &&
    prevProps.field.isMandatory === nextProps.field.isMandatory
  );
});

CellEditorFactory.displayName = 'CellEditorFactory';

export default CellEditorFactory;