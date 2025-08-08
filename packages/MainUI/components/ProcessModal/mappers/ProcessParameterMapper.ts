import type { Field, ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import type { 
  ExtendedProcessParameter,
  ProcessDefaultsResponse,
  ProcessDefaultValue
} from "../types/ProcessParameterExtensions";
import { 
  isReferenceValue,
  isSimpleValue
} from "../types/ProcessParameterExtensions";
import { logger } from "@/utils/logger";

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
    const mappedReference = this.mapReferenceType(parameter.reference);
    
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
        length: "255", // Default length, can be overridden
        ...parameter.column,
        reference: mappedReference
      },
      
      // Selector configuration for datasource fields
      selector: this.mapSelectorInfo(mappedReference, parameter),
      
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
   * Maps selector information for datasource-dependent field types
   * @param reference - The mapped reference code
   * @param parameter - The original ProcessParameter
   * @returns Selector configuration object
   */
  static mapSelectorInfo(reference: string, parameter: ProcessParameter | ExtendedProcessParameter): any {
    // If parameter already has selector info, use it
    if (parameter.selector) {
      return parameter.selector;
    }

    // Map reference types to appropriate datasource names
    const datasourceMap: Record<string, string> = {
      [FIELD_REFERENCE_CODES.PRODUCT]: "ProductByPriceAndWarehouse",
      [FIELD_REFERENCE_CODES.TABLE_DIR_19]: "ComboTableDatasourceService",
      [FIELD_REFERENCE_CODES.TABLE_DIR_18]: "ComboTableDatasourceService",
      [FIELD_REFERENCE_CODES.SELECT_30]: "ComboTableDatasourceService",
    };

    const datasourceName = datasourceMap[reference];
    
    if (datasourceName) {
      return {
        datasourceName,
        _textMatchStyle: "startsWith",
        _noCount: true,
        _selectedProperties: "id",
        _extraProperties: "_identifier,",
        extraSearchFields: "",
      };
    }

    // Return undefined for field types that don't need datasource
    return undefined;
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
      
      // Select types
      "Select": FIELD_REFERENCE_CODES.SELECT_30,
      
      // Product types
      "Product": FIELD_REFERENCE_CODES.PRODUCT,
      
      // Table Directory types
      "TableDir": FIELD_REFERENCE_CODES.TABLE_DIR_19,
      "Table Directory": FIELD_REFERENCE_CODES.TABLE_DIR_19,
      
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
      "Date", "DateTime", "List", "Select", "Product", "TableDir", "Table Directory", "Window"
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
    if ([FIELD_REFERENCE_CODES.DECIMAL, FIELD_REFERENCE_CODES.INTEGER].includes(reference as any)) {
      return "numeric";
    }
    if ([FIELD_REFERENCE_CODES.QUANTITY_29, FIELD_REFERENCE_CODES.QUANTITY_22].includes(reference as any)) {
      return "quantity";
    }
    if (reference === FIELD_REFERENCE_CODES.DATE) return "date";
    if (reference === FIELD_REFERENCE_CODES.DATETIME) return "datetime";
    if (reference === FIELD_REFERENCE_CODES.SELECT_30) return "select";
    if (reference === FIELD_REFERENCE_CODES.PRODUCT) return "product";
    if ([FIELD_REFERENCE_CODES.TABLE_DIR_19, FIELD_REFERENCE_CODES.TABLE_DIR_18].includes(reference as any)) return "tabledir";
    if ([FIELD_REFERENCE_CODES.LIST_17, FIELD_REFERENCE_CODES.LIST_13].includes(reference as any)) return "list";
    if (reference === FIELD_REFERENCE_CODES.WINDOW) return "window";
    
    return "text"; // Default fallback
  }

  /**
   * Maps DefaultsProcessActionHandler response to parameter-based field names
   * This handles the complex response structure with mixed value types
   * @param response - Raw response from DefaultsProcessActionHandler
   * @param parameters - Array of ProcessParameters for field name mapping
   * @returns Processed response with mapped field names
   */
  static mapInitializationResponse(
    response: Record<string, any>,
    parameters: ProcessParameter[]
  ): ProcessDefaultsResponse {
    try {
      // Create parameter lookup maps for efficient mapping
      const parameterByName = new Map<string, ProcessParameter>();
      const parameterByColumn = new Map<string, ProcessParameter>();
      
      parameters.forEach(param => {
        parameterByName.set(param.name, param);
        if (param.dBColumnName) {
          parameterByColumn.set(param.dBColumnName, param);
        }
      });

      const defaults: Record<string, ProcessDefaultValue> = {};
      const filterExpressions: Record<string, Record<string, any>> = {};

      // Process the raw response
      for (const [key, value] of Object.entries(response)) {
        if (key === 'filterExpressions') {
          // Handle filter expressions directly
          Object.assign(filterExpressions, value || {});
          continue;
        }

        if (key === 'refreshParent') {
          // Skip - handled separately
          continue;
        }

        // Try to map field names from response keys
        let mappedFieldName = key;
        
        // Handle 'inp' prefixed fields (common in Openbravo responses)
        if (key.startsWith('inp')) {
          const fieldName = key.substring(3); // Remove 'inp' prefix
          
          // Try to find parameter by various naming patterns
          const parameter = parameterByName.get(fieldName) || 
                           parameterByColumn.get(fieldName) ||
                           parameterByName.get(fieldName.toLowerCase()) ||
                           parameterByColumn.get(fieldName.toLowerCase());
          
          if (parameter) {
            mappedFieldName = parameter.name;
          } else {
            mappedFieldName = fieldName;
          }
        }

        // Store the mapped value
        defaults[mappedFieldName] = value;
      }

      const processedResponse: ProcessDefaultsResponse = {
        defaults,
        filterExpressions,
        refreshParent: !!response.refreshParent
      };

      logger.debug("Mapped initialization response:", {
        originalKeys: Object.keys(response).length,
        mappedDefaults: Object.keys(defaults).length,
        filterExpressions: Object.keys(filterExpressions).length,
        refreshParent: processedResponse.refreshParent
      });

      return processedResponse;
    } catch (error) {
      logger.error("Error mapping initialization response:", error);
      
      // Return safe fallback
      return {
        defaults: {},
        filterExpressions: {},
        refreshParent: false
      };
    }
  }

  /**
   * Processes process defaults for React Hook Form compatibility
   * @param processDefaults - ProcessDefaultsResponse from backend
   * @param parameters - Array of ProcessParameters for type information
   * @returns Object ready for form initialization
   */
  static processDefaultsForForm(
    processDefaults: ProcessDefaultsResponse,
    parameters: ProcessParameter[]
  ): Record<string, any> {
    const formData: Record<string, any> = {};
    
    try {
      // Create parameter lookup for type information
      const parameterMap = new Map<string, ProcessParameter>();
      parameters.forEach(param => {
        parameterMap.set(param.name, param);
      });

      const isLogicField = (name: string) =>
        name.endsWith('_display_logic') || name.endsWith('_readonly_logic');

      const convertSimpleValue = (val: any, param?: ProcessParameter) => {
        if (
          param?.reference === FIELD_REFERENCE_CODES.BOOLEAN ||
          param?.reference === 'Yes/No' ||
          param?.reference === 'Boolean'
        ) {
          return val === 'Y' || val === true;
        }
        return val;
      };

      for (const [fieldName, value] of Object.entries(processDefaults.defaults)) {
        try {
          // Skip logic fields (processed separately)
          if (isLogicField(fieldName)) {
            continue;
          }

          const parameter = parameterMap.get(fieldName);
          
          if (isReferenceValue(value)) {
            // Handle reference objects with value/identifier
            formData[fieldName] = value.value;
            if (value.identifier) {
              formData[`${fieldName}$_identifier`] = value.identifier;
            }
            
            logger.debug(`Processed reference field ${fieldName}:`, {
              value: value.value,
              identifier: value.identifier,
              parameterType: parameter?.reference
            });
          } else if (isSimpleValue(value)) {
            // Handle simple values with type conversion
            formData[fieldName] = convertSimpleValue(value, parameter);
            
            logger.debug(`Processed simple field ${fieldName}:`, {
              value: value,
              type: typeof value,
              parameterType: parameter?.reference
            });
          } else {
            // Fallback for unexpected types
            logger.warn(`Unexpected value type for field ${fieldName}:`, value);
            formData[fieldName] = String(value || "");
          }
        } catch (fieldError) {
          logger.error(`Error processing field ${fieldName}:`, fieldError);
          formData[fieldName] = ""; // Safe fallback
        }
      }

      logger.debug("Processed form data:", {
        totalFields: Object.keys(formData).length,
        fieldNames: Object.keys(formData)
      });

      return formData;
    } catch (error) {
      logger.error("Error processing defaults for form:", error);
      return {}; // Safe fallback
    }
  }

  /**
   * Extracts logic fields from process defaults
   * @param processDefaults - ProcessDefaultsResponse from backend
   * @returns Object with display and readonly logic flags
   */
  static extractLogicFields(processDefaults: ProcessDefaultsResponse): Record<string, boolean> {
    const logicFields: Record<string, boolean> = {};
    
    try {
      for (const [fieldName, value] of Object.entries(processDefaults.defaults)) {
        if (fieldName.endsWith('_display_logic')) {
          const baseField = fieldName.replace('_display_logic', '');
          logicFields[`${baseField}.display`] = value === "Y";
        } else if (fieldName.endsWith('_readonly_logic')) {
          const baseField = fieldName.replace('_readonly_logic', '');
          logicFields[`${baseField}.readonly`] = value === "Y";
        }
      }

      logger.debug("Extracted logic fields:", logicFields);
      return logicFields;
    } catch (error) {
      logger.error("Error extracting logic fields:", error);
      return {};
    }
  }
}
