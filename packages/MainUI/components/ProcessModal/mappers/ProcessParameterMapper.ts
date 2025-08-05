import type { Field, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import type { ExtendedProcessParameter } from "../types/ProcessParameterExtensions";

/**
 * Maps ProcessParameter to FormView Field interface
 * This allows reuse of existing FormView selectors in ProcessModal
 */
export class ProcessParameterMapper {
  /**
   * Maps a ProcessParameter to a FormView Field interface
   * @param parameter - The ProcessParameter from the process definition
   * @returns Field interface compatible with FormView selectors
   */
  static mapToField(parameter: ProcessParameter | ExtendedProcessParameter): Field {
    return {
      // Core identification properties
      hqlName: parameter.dBColumnName || parameter.name,
      inputName: parameter.dBColumnName || parameter.name,
      columnName: parameter.dBColumnName || parameter.name,
      id: parameter.id,
      name: parameter.name,
      
      // Form behavior properties
      isMandatory: parameter.mandatory || false,
      displayed: true,
      startnewline: false,
      showInGridView: false,
      isDisplayed: true,
      isUpdatable: true,
      sequenceNumber: 0,
      
      // Reference and type information
      column: {
        reference: this.mapReferenceType(parameter.reference),
        length: "255", // Default length, can be overridden
        ...parameter.column
      },
      
      // List data for select/list fields
      refList: parameter.refList || [],
      
      // Logic expressions for dynamic behavior
      displayLogicExpression: parameter.displayLogic,
      readOnlyLogicExpression: parameter.readOnlyLogicExpression,
      isReadOnly: false, // Will be evaluated dynamically
      
      // Description and help
      description: parameter.description || "",
      helpComment: parameter.help || "",
      
      // Default values
      hasDefaultValue: !!parameter.defaultValue,
      
      // Placeholder properties for Field interface compatibility
      process: "",
      shownInStatusBar: false,
      tab: "",
      fieldGroup$_identifier: "",
      fieldGroup: "",
      module: "",
      refColumnName: "",
      targetEntity: "",
      gridProps: {
        sort: 0,
        autoExpand: false,
        editorProps: {
          displayField: "_identifier",
          valueField: "id"
        },
        displaylength: 0,
        fkField: false,
        selectOnClick: false,
        canSort: false,
        canFilter: false,
        showHover: false,
        filterEditorProperties: {
          keyProperty: "id"
        },
        showIf: ""
      },
      type: parameter.reference || "String",
      field: [],
      referencedEntity: "",
      referencedWindowId: "",
      referencedTabId: ""
    };
  }

  /**
   * Maps process parameter reference types to FormView field reference codes
   * @param reference - The reference type from ProcessParameter
   * @returns Mapped reference code for FormView compatibility
   */
  private static mapReferenceType(reference: string): string {
    // Map textual references from process definition to reference codes
    const referenceMap: Record<string, string> = {
      // Boolean types
      "Yes/No": FIELD_REFERENCE_CODES.BOOLEAN,
      "YesNo": FIELD_REFERENCE_CODES.BOOLEAN,
      "Boolean": FIELD_REFERENCE_CODES.BOOLEAN,
      
      // Numeric types
      "Amount": FIELD_REFERENCE_CODES.DECIMAL,
      "Number": FIELD_REFERENCE_CODES.DECIMAL,
      "Decimal": FIELD_REFERENCE_CODES.DECIMAL,
      "Integer": FIELD_REFERENCE_CODES.INTEGER,
      "Quantity": FIELD_REFERENCE_CODES.QUANTITY_29,
      
      // Date types
      "Date": FIELD_REFERENCE_CODES.DATE,
      "DateTime": FIELD_REFERENCE_CODES.DATETIME,
      
      // List types
      "List": FIELD_REFERENCE_CODES.LIST_17,
      
      // Password
      "Password": FIELD_REFERENCE_CODES.PASSWORD,
      
      // Window reference
      "Window": FIELD_REFERENCE_CODES.WINDOW,
      
      // String/Text (default)
      "String": "10", // Text reference
      "Text": "10"
    };

    // Return mapped reference or the original reference if already a code
    return referenceMap[reference] || reference || "10";
  }

  /**
   * Validates if a ProcessParameter can be mapped to a Field
   * @param parameter - The ProcessParameter to validate
   * @returns true if mappable, false otherwise
   */
  static canMapParameter(parameter: ProcessParameter | ExtendedProcessParameter): boolean {
    // Check if required properties exist
    if (!parameter || !parameter.name) {
      return false;
    }

    // Check if reference type is supported
    const supportedReferences = [
      "String", "Text", "Password", "Yes/No", "YesNo", "Boolean",
      "Amount", "Number", "Decimal", "Integer", "Quantity",
      "Date", "DateTime", "List", "Window"
    ];

    return !parameter.reference || 
           supportedReferences.includes(parameter.reference) ||
           Object.values(FIELD_REFERENCE_CODES).includes(parameter.reference as any);
  }

  /**
   * Gets the expected field type for UI rendering
   * @param parameter - The ProcessParameter
   * @returns Field type identifier for selector routing
   */
  static getFieldType(parameter: ProcessParameter | ExtendedProcessParameter): string {
    const reference = this.mapReferenceType(parameter.reference);
    
    if (reference === FIELD_REFERENCE_CODES.PASSWORD) return "password";
    if (reference === FIELD_REFERENCE_CODES.BOOLEAN) return "boolean";
    if ([FIELD_REFERENCE_CODES.DECIMAL, FIELD_REFERENCE_CODES.INTEGER, FIELD_REFERENCE_CODES.QUANTITY_29].includes(reference as any)) {
      return "numeric";
    }
    if ([FIELD_REFERENCE_CODES.DATE, FIELD_REFERENCE_CODES.DATETIME].includes(reference as any)) return "date";
    if ([FIELD_REFERENCE_CODES.LIST_17, FIELD_REFERENCE_CODES.LIST_13].includes(reference as any)) return "list";
    if (reference === FIELD_REFERENCE_CODES.WINDOW) return "window";
    
    return "text"; // Default fallback
  }
}