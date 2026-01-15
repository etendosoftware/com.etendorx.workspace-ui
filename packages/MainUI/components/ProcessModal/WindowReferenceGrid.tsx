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

import { useTranslation } from "@/hooks/useTranslation";
import { useTab } from "@/hooks/useTab";
import type { EntityData, EntityValue, Column, Tab } from "@workspaceui/api-client/src/api/types";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_RowSelectionState,
  type MRT_ColumnFiltersState,
  type MRT_TableOptions,
  type MRT_Row,
  type MRT_TopToolbarProps,
  type MRT_ColumnDef,
} from "material-react-table";
import { useDatasource } from "@/hooks/useDatasource";
import { useGridColumnFilters } from "@/hooks/table/useGridColumnFilters";
import { useColumns } from "@/hooks/table/useColumns";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorDisplay } from "../ErrorDisplay";
import EmptyState from "../Table/EmptyState";
import Loading from "../loading";
import { tableStyles } from "./styles";
import type { WindowReferenceGridProps } from "./types";
import type { GridSelectionStructure } from "./ProcessDefinitionModal";
import PlusIcon from "../../../ComponentLibrary/src/assets/icons/plus.svg";
import { saveRecord } from "../Table/utils/saveOperations";
import type { SaveOperation } from "../Table/types/inlineEditing";
import { useUserContext } from "@/hooks/useUserContext";
import { GridCellEditor } from "./GridCellEditor";
import { WindowReferenceGridProvider, useWindowReferenceGridContext } from "./WindowReferenceGridContext";
import { getFieldReference } from "@/utils";
import { PROCESS_DEFINITION_DATA } from "../../utils/processes/definition/constants";

const MAX_WIDTH = 100;
const PAGE_SIZE = 100;

/**
 * Extracts the actual value from a wrapped value object or returns the value directly
 */
function extractActualValue(value: unknown): EntityValue {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as { value: EntityValue }).value;
  }
  return value as EntityValue;
}

/**
 * Merges default values into the params object
 */
function mergeDefaultsIntoParams(defaults: Record<string, unknown>, mergedParams: Record<string, EntityValue>): void {
  for (const [key, value] of Object.entries(defaults)) {
    mergedParams[key] = extractActualValue(value);
  }
}

/**
 * Merges current values into the params object, overriding defaults
 */
function mergeCurrentValuesIntoParams(
  currentValues: Record<string, unknown>,
  mergedParams: Record<string, EntityValue>
): void {
  for (const [key, value] of Object.entries(currentValues)) {
    if (value !== undefined && value !== null) {
      mergedParams[key] = value as EntityValue;
    }
  }
}

/**
 * WindowReferenceGrid Component
 * Displays a grid of referenced records that can be selected
 */

// Stable renderer component that consumes context instead of closures
// detailed props type would be better but simple any works for MRT contract here
const StableGridCellEditorRenderer = ({ cell, row, column }: any) => {
  const { fieldsRef, handleRecordChangeRef, validations } = useWindowReferenceGridContext();

  // Check for validation errors for this row
  // We try to match by row.id in validation context, or fallback to generic logic if needed
  const validationError = validations?.find((v: any) => {
    if (!v.isValid && v.context) {
      // Check if validation context matches this row
      if (v.context.id === row.original.id) return true;
      if (v.context.rowId === row.original.id) return true;
    }
    return false;
  });

  // GridCellEditor expects 'col' with columnName.
  // column.columnDef usually has what we populated in useMemo columns.
  return (
    <GridCellEditor
      cell={cell}
      row={row}
      col={column.columnDef}
      fields={fieldsRef.current}
      onRecordChange={handleRecordChangeRef.current || undefined}
      validationError={validationError}
      data-testid="GridCellEditor__ce8544"
    />
  );
};

// Helper to resolve parent context ID
const resolveParentContextId = (
  dbName: string,
  effectiveRecordValues: any,
  currentValues: any
): { parentContextId: string | undefined; contextDocNo: string | undefined } => {
  // Helper: convert DB_NAME to inpDbName (camelCase)
  const toCamel = (s: string) => {
    return s
      .toLowerCase()
      .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      .replace(/_id$/, "Id");
  };
  const inpName = `inp${toCamel(dbName)}`;

  // Potential keys to find the ID
  const keysToCheck = [
    dbName,
    inpName,
    `inp${dbName}`, // simple prefix
  ];

  // Specific mapping for Add Payment 'order_invoice' generic parameter
  const isOrderInvoiceGrid = ["order_invoice", "C_Order_ID", "C_Invoice_ID"].includes(dbName);

  if (isOrderInvoiceGrid) {
    keysToCheck.push("C_Order_ID", "C_Invoice_ID", "inpcOrderId", "inpcInvoiceId");
  }

  let parentContextId: string | undefined;

  // Search in effective values
  for (const k of keysToCheck) {
    const val = effectiveRecordValues?.[k] || currentValues?.[k];
    if (val && typeof val === "string") {
      // Relaxed length check for debugging, usually 32 uuid
      if (val.length === 32) {
        parentContextId = val;
        break;
      }
    }
  }

  // Also retrieve Document No from context for fallback matching
  const contextDocNo = effectiveRecordValues?.["inpdocumentno"] || currentValues?.["inpdocumentno"];

  return { parentContextId, contextDocNo };
};

// Stable renderer for read-only cells
const ReadOnlyCellRenderer = ({ renderedCellValue }: any) => (
  <span className="text-gray-700 block truncate" title={String(renderedCellValue ?? "")}>
    {renderedCellValue}
  </span>
);

// Stable renderer for interactive cells
const InteractiveGridCellRenderer = ({ row, cell, column }: any) => {
  const isSelected = row.getIsSelected();
  // Get dbColumnName from column definition (passed via custom property)
  const dbColumnName = column.columnDef?.dbColumnName;

  // glItems are always local/editable
  const isAlwaysEditable = dbColumnName === "glitem";

  if (isSelected || isAlwaysEditable) {
    return (
      <StableGridCellEditorRenderer
        row={row}
        cell={cell}
        column={column}
        data-testid="StableGridCellEditorRenderer__ce8544"
      />
    );
  }

  return cell.getValue();
};

const updateLocalRecordFromSelection = (record: EntityData, selectionItem: any): EntityData | null => {
  let updated = false;
  let newRecord = { ...record };

  if (selectionItem.amount !== undefined && selectionItem.amount !== newRecord.amount) {
    newRecord.amount = selectionItem.amount;
    updated = true;
  }
  if (selectionItem.paymentAmount !== undefined && selectionItem.paymentAmount !== newRecord.paymentAmount) {
    newRecord.paymentAmount = selectionItem.paymentAmount;
    updated = true;
  }

  if (updated) {
    return { ...newRecord, ...selectionItem };
  }
  return null;
};

const resetLocalRecordFields = (record: EntityData): EntityData | null => {
  let changed = false;
  let newRecord = { ...record };

  if (newRecord.amount !== undefined && newRecord.amount !== 0) {
    newRecord.amount = 0;
    changed = true;
  }
  if (newRecord.paymentAmount !== undefined && newRecord.paymentAmount !== 0) {
    newRecord.paymentAmount = 0;
    changed = true;
  }

  return changed ? newRecord : null;
};

// Logic extracted to reduce cognitive complexity of useEffect
const syncGridSelectionToLocalRecords = (
  externalSelection: any[],
  localRecords: EntityData[],
  setLocalRecords: (records: EntityData[]) => void
) => {
  let hasChanges = false;
  const newRecords = [...localRecords];
  const selectionMap = new Map(externalSelection.map((s: any) => [String(s.id), s]));

  for (let i = 0; i < newRecords.length; i++) {
    const record = newRecords[i];
    const selectionItem = selectionMap.get(String(record.id));

    if (selectionItem) {
      const updated = updateLocalRecordFromSelection(record, selectionItem);
      if (updated) {
        newRecords[i] = updated;
        hasChanges = true;
      }
    } else {
      const reset = resetLocalRecordFields(record);
      if (reset) {
        newRecords[i] = reset;
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    setLocalRecords(newRecords);
  }
};

// Helper to find valid matching record in grid
const findMatchingRecord = (
  rawRecords: any[],
  parentContextId: string | undefined,
  contextDocNo: string | undefined
) => {
  if (!rawRecords || rawRecords.length === 0) return undefined;

  return rawRecords.find(
    (r: any) =>
      (parentContextId &&
        (r.id === parentContextId ||
          r.order === parentContextId ||
          r.c_order_id === parentContextId ||
          r.salesOrder === parentContextId ||
          r.invoice === parentContextId ||
          r.c_invoice_id === parentContextId ||
          r.c_order_id?._identifier === parentContextId)) || // Edge case
      (contextDocNo &&
        typeof contextDocNo === "string" &&
        (r.salesOrderNo === contextDocNo || r.invoiceNo === contextDocNo || r.documentNo === contextDocNo))
  );
};

// Local type for datasource params
interface DatasourceParams {
  processId?: string;
  tabId?: string;
  windowId?: string;
  ad_org_id?: any;
  ad_client_id?: any;
  orderBy?: string;
  criteria?: any;
  [key: string]: any;
}

const WindowReferenceGrid = ({
  parameter,
  tabId,
  currentValues, // passed from ProcessDefinitionModal
  fields,
  gridSelection,
  onSelectionChange,
  parameters,
  // Added back missing props
  entityName,
  windowReferenceTab,
  processConfig,
  processConfigLoading,
  processConfigError,
  recordValues,
}: WindowReferenceGridProps) => {
  const { t } = useTranslation();
  // ... rest of component

  const contentRef = useRef<HTMLDivElement>(null);
  const { loading: tabLoading, error: tabError } = useTab(windowReferenceTab?.id);

  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [appliedTableFilters, setAppliedTableFilters] = useState<MRT_ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  // Merge recordValues (static context) with currentValues (live form state)
  // currentValues takes precedence for parameters being edited
  const effectiveRecordValues = useMemo(
    () => ({
      ...recordValues,
      ...currentValues,
    }),
    [recordValues, currentValues]
  );

  const [_validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});
  const { user, session, currentClient } = useUserContext();

  const effectiveRecordValuesRef = useRef(effectiveRecordValues);
  const parametersRef = useRef(parameters);
  const validationsRef = useRef<any[]>((effectiveRecordValues?._validations as unknown as any[]) || []);
  // Sync refs ensures GridCellEditor has latest values without triggering re-render via Context
  useEffect(() => {
    effectiveRecordValuesRef.current = effectiveRecordValues;
    parametersRef.current = parameters;
    validationsRef.current = (effectiveRecordValues?._validations as unknown as any[]) || [];
  }, [effectiveRecordValues, parameters]);

  // Get validations array for context (to trigger updates)
  const validations = useMemo(() => {
    // biome-ignore lint/suspicious/noExplicitAny: explicit cast
    return (effectiveRecordValues?._validations as unknown as any[]) || [];
  }, [effectiveRecordValues]);

  const [isDataReady, setIsDataReady] = useState(false);

  const lastDefaultsRef = useRef<string>("");
  const lastFilterExpressionsRef = useRef<string>("");
  const stableWindowReferenceTabRef = useRef<typeof windowReferenceTab | undefined>(windowReferenceTab);

  // Stabilize windowReferenceTab reference to prevent infinite re-renders
  if (windowReferenceTab && windowReferenceTab.id !== stableWindowReferenceTabRef.current?.id) {
    stableWindowReferenceTabRef.current = windowReferenceTab;
  }
  const stableWindowReferenceTab = stableWindowReferenceTabRef.current;

  const stableProcessDefaults = useMemo<Record<string, EntityValue>>(() => {
    const defaults = (processConfig?.defaults as unknown as Record<string, EntityValue>) || {};
    const defaultsString = JSON.stringify(defaults);

    if (defaultsString !== lastDefaultsRef.current) {
      lastDefaultsRef.current = defaultsString;
      return defaults;
    }

    return lastDefaultsRef.current ? JSON.parse(lastDefaultsRef.current) : {};
  }, [processConfig?.defaults]);

  const stableFilterExpressions = useMemo(() => {
    const filters = processConfig?.filterExpressions || {};
    const filtersString = JSON.stringify(filters);

    if (filtersString !== lastFilterExpressionsRef.current) {
      lastFilterExpressionsRef.current = filtersString;
      return filters;
    }

    return lastFilterExpressionsRef.current ? JSON.parse(lastFilterExpressionsRef.current) : {};
  }, [processConfig?.filterExpressions]);

  useEffect(() => {
    if (!processConfigLoading && processConfig) {
      const timer = setTimeout(() => {
        setIsDataReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [processConfigLoading, processConfig]);

  // Stabilize effectiveRecordValues to prevent unnecessary re-fetches
  const stableRecordValues = useMemo(() => effectiveRecordValues, [JSON.stringify(effectiveRecordValues)]);

  const datasourceOptions = useMemo(() => {
    const options: DatasourceParams = {};
    // Restore legacy behavior: property tabId is vital for backend context resolution
    // If parameter.tab is missing, use the component's tabId prop (which usually holds the WindowID in process context)
    options.tabId = parameter.tab || tabId;

    if (processConfig?.processId) {
      options.processId = processConfig.processId;
    }

    if (tabId) {
      options.windowId = tabId;
    }

    // Apply filters and context
    // This logic mimics verifyInput in SmartClient
    // We need to support:
    // 1. Explicit Validation Logic (displayLogic/readOnlyLogic often implies data dependencies) - handled by Callouts mostly
    // 2. Default Values (passed from ProcessDefinitionModal)
    // 3. Grid Filters (passed from ProcessDefinitionModal)

    const defaultKeys = {
      inpadOrgId: "ad_org_id",
      inpadClientId: "ad_client_id",
    };

    const applyDynamicKeys = () => {
      if (!stableRecordValues) return;

      // Standard env variables
      if (stableRecordValues.inpadOrgId) options.ad_org_id = stableRecordValues.inpadOrgId;
      if (stableRecordValues.inpadClientId) options.ad_client_id = stableRecordValues.inpadClientId;

      // Apply dynamic keys from process configuration
      const processId = processConfig?.processId;
      if (processId) {
        const processDef = PROCESS_DEFINITION_DATA[processId as keyof typeof PROCESS_DEFINITION_DATA];
        if (processDef?.dynamicKeys) {
          for (const [key, value] of Object.entries(processDef.dynamicKeys)) {
            let payloadKey = key;
            let contextKey = value as string;

            // Handle both mapping styles:
            // 1. payloadKey: "@ContextKey@" -> Resolve ContextKey, send as payloadKey
            // 2. "@PayloadKey@": "contextKey" -> Resolve contextKey, send as @PayloadKey@
            if (typeof contextKey === "string" && contextKey.startsWith("@") && contextKey.endsWith("@")) {
              contextKey = contextKey.slice(1, -1);
            }

            let resolvedValue = stableRecordValues[contextKey] || stableRecordValues[`inp${contextKey}`];
            if (resolvedValue !== undefined && resolvedValue !== null) {
              // Convert "Y"/"N" to boolean true/false
              if (resolvedValue === "Y") {
                resolvedValue = true;
              } else if (resolvedValue === "N") {
                resolvedValue = false;
              }
              // Convert numeric strings to numbers (e.g., "102" -> 102, "0" -> 0)
              else if (
                typeof resolvedValue === "string" &&
                resolvedValue !== "" &&
                !Number.isNaN(Number(resolvedValue)) &&
                resolvedValue.length < 15 // Avoid converting UUIDs that happen to be numeric
              ) {
                resolvedValue = Number(resolvedValue);
              }

              options[payloadKey] = resolvedValue;
            }
          }
        }
      }
    };

    const applyParameters = () => {
      // 1. Merge defaults and current values into a single map
      const mergedParams: Record<string, EntityValue> = {};

      // Apply defaults using helper function
      if (stableProcessDefaults && Object.keys(stableProcessDefaults).length > 0) {
        mergeDefaultsIntoParams(stableProcessDefaults, mergedParams);
      }

      // Apply current values (overrides defaults) using helper function
      if (currentValues && Object.keys(currentValues).length > 0) {
        mergeCurrentValuesIntoParams(currentValues, mergedParams);
      }

      // 2. Process merged parameters
      for (const [key, finalValue] of Object.entries(mergedParams)) {
        // If it's a mapped system key, apply to options
        if (defaultKeys && key in defaultKeys) {
          options[defaultKeys[key as keyof typeof defaultKeys]] = finalValue;
          continue;
        }

        const matchingParameter = Object.values(parameters).find((param) => param.name === key);
        if (matchingParameter) {
          options[matchingParameter.dBColumnName || key] = finalValue;
        }
      }
    };

    const buildCriteria = (): Array<{ fieldName: string; operator: string; value: EntityValue }> => {
      if (!stableFilterExpressions?.grid) return [];

      return Object.entries(stableFilterExpressions.grid).map(([fieldName, value]) => {
        let parsedValue: EntityValue;
        let operator = "equals";

        if (value === "true") {
          parsedValue = true;
        } else if (value === "false") {
          parsedValue = false;
        } else if (typeof value === "string") {
          const isUUID = /^[0-9a-fA-F]{32}$/.test(value);
          if (!isUUID) {
            operator = "iContains";
          }
          parsedValue = value;
        } else {
          parsedValue = value as EntityValue;
        }

        return {
          fieldName,
          operator,
          value: parsedValue,
        };
      });
    };

    // Build set of valid column names for this grid to filter params
    const validColumnNames = new Set<string>();
    if (stableWindowReferenceTab?.fields) {
      Object.values(stableWindowReferenceTab.fields).forEach((f: any) => {
        if (f.columnName) validColumnNames.add(f.columnName.toLowerCase());
        // also add hqlName if different
        if (f.hqlName) validColumnNames.add(f.hqlName.toLowerCase());
      });
    }
    // Also add prop fields if any
    if (fields) {
      fields.forEach((f: any) => {
        if (f.columnName) validColumnNames.add(f.columnName.toLowerCase());
        if (f.name) validColumnNames.add(f.name.toLowerCase());
      });
    }
    // Add standard context keys that imply filtering
    [
      "c_bpartner_id",
      "m_product_id",
      "c_project_id",
      "c_campaign_id",
      "c_activity_id",
      "user1_id",
      "user2_id",
      "ad_org_id",
      "ad_client_id",
      "trxtype",
      "issotrx",
      "transaction_type",
    ].forEach((k) => validColumnNames.add(k));

    const applyRecordValues = () => {
      if (!parameters || !stableRecordValues) return;

      Object.values(parameters).forEach((param: any) => {
        const paramValue = effectiveRecordValues[param.name];
        // Only include parameter if it matches a column in the grid OR is a standard ID
        if (paramValue !== undefined && param.dBColumnName) {
          const lowerKey = param.dBColumnName.toLowerCase();
          if (validColumnNames.has(lowerKey)) {
            options[param.dBColumnName] = paramValue as any;
          }
        }
      });
    };

    applyDynamicKeys();
    applyParameters();
    applyRecordValues();

    const criteria = buildCriteria();

    if (criteria.length > 0) {
      options.orderBy = "documentNo desc";
      // Keep criteria as array of objects, cast to EntityValue for type compatibility
      options.criteria = criteria as unknown as EntityValue;
    }

    return options;
  }, [
    processConfig?.processId,
    parameter.tab,
    tabId,
    stableProcessDefaults,
    stableFilterExpressions,
    recordValues?.inpadClientId,
    recordValues?.inpmPricelistId,
    recordValues?.inpcCurrencyId,
    stableRecordValues, // Using stabilized reference
    parameters,
    // Use stable JSON stringified values for dependency to prevent infinite loops
    JSON.stringify(currentValues),
    // Add dependencies for column validation
    stableWindowReferenceTab,
    fields,
  ]);

  // Helper to determine ACCT_DIMENSION_DISPLAY for specific columns
  const getAcctDimensionDisplay = useCallback(
    (columnName: string) => {
      if (!currentClient) return "";

      // Generic logic to map column name to client property
      // e.g. C_BPartner_ID -> bpartnerAcctdimBreakdown

      // 1. Remove _ID suffix (case insensitive)
      let key = columnName.replace(/_ID$/i, "");
      // 2. Remove C_ or M_ prefix (case insensitive) if present
      key = key.replace(/^[CM]_/i, "");

      const propName = `${key.toLowerCase()}AcctdimBreakdown`;
      // Check if property exists on currentClient
      const isActive = (currentClient as any)[propName];

      return isActive === true ? "Y" : "";
    },
    [currentClient]
  );

  const isFieldVisible = useCallback(
    (field: any) => {
      if (field.isActive === false) return false;
      if (field.displayed === false) return false;
      if (field.showInGridView === false) return false;

      const accVal = getAcctDimensionDisplay(field.columnName) || "";

      const context = {
        ...user,
        ...session,
        ...recordValues,
        ACCT_DIMENSION_DISPLAY: accVal,
      };

      // Evaluate Display Logic
      if (field.displayLogicExpression) {
        try {
          const compiledExpr = compileExpression(field.displayLogicExpression);
          if (!compiledExpr(session, context)) return false;
        } catch (e) {
          console.warn(`Error evaluating display logic for field ${field.name}`, e);
        }
      }

      // Evaluate Grid Display Logic (if present)
      const gridLogic = field.gridDisplayLogic;
      if (gridLogic) {
        try {
          const compiledExpr = compileExpression(gridLogic);
          if (!compiledExpr(session, context)) return false;
        } catch (e) {
          console.warn(`Error evaluating grid display logic for field ${field.name}`, e);
        }
      }

      return true;
    },
    [getAcctDimensionDisplay, user, session, recordValues]
  );

  // Filter fields based on visibility logic (displayLogic & gridDisplayLogic)
  // Use a stringified version of the result to ensure referential stability
  // This prevents 'rawColumns' and 'columns' from regenerating on every 'recordValues' change
  // if the ACTUAL set of visible columns hasn't changed.
  const visibleFieldsFromTab = useMemo(() => {
    if (!stableWindowReferenceTab?.fields) return [];

    const visibleFields = Object.values(stableWindowReferenceTab.fields).filter((f: any) => isFieldVisible(f));

    // Parse the filtered fields
    const parsed = visibleFields.map((field: any) => ({
      ...field,
      // Ensure hqlName is consistent for grid columns
      hqlName: field.columnName || field.hqlName,
      label: field.name,
    }));
    return parsed;
  }, [stableWindowReferenceTab?.fields, isFieldVisible]); // isFieldVisible changes often, but we check result below

  // Stablize the array reference
  const stableVisibleFields = useMemo(() => {
    return visibleFieldsFromTab;
  }, [JSON.stringify(visibleFieldsFromTab.map((f: any) => f.id))]); // Only update if IDs change

  // Compute raw columns from fields
  const rawColumns = useMemo(() => {
    // Only use parsed fields for columns, fallback to provided fields prop if empty
    if (stableVisibleFields.length > 0) {
      // Map back to column structure expected by SmartClient-like grids
      const enriched = stableVisibleFields.map((field: any) => ({
        id: field.id,
        header: field.name || field.columnName,
        accessorKey: field.columnName,
        columnName: field.columnName,
        type: getFieldReference(field.reference || field.column?.reference),
        // Important properties for column setup
        canHide: true,
        enableColumnFilter: true,
        enableSorting: true,
        ...field,
        // Match with passed prop fields to ensure we have all metadata
        // Note: 'fields' prop comes from ProcessDefinitionModal which might have different enrichment
      }));
      return enriched;
    }

    // Use fields prop passed to component (legacy path)
    // This path is for when fields are passed directly, not from stableWindowReferenceTab
    if (fields && fields.length > 0) {
      // Assuming 'fields' is a prop or another source
      // Create column definitions from Fields
      const enriched = fields.map((col: any) => {
        // Find matching field definition if possible
        const matchingField = fields.find((f) => f.id === col.id);
        const isDisplayName = !col.columnName || col.columnName === col.header; // Simplified check

        // For filtering, we need to check if hqlName is a display name
        // If hqlName is a display name, use the key from fields (camelCase property name)
        // Otherwise, use hqlName as-is
        const filterFieldName = isDisplayName
          ? matchingField?.column?._identifier ||
            (Object.keys(fields) as Array<keyof typeof fields>).find((k) => fields[k] === matchingField) ||
            col.columnName
          : col.columnName;

        return {
          ...col,
          filterFieldName, // This will be used for backend filtering
        };
      });

      return enriched;
    }
    return [];
  }, [fields]);

  // Column filters hook - needs stable columns reference
  const stableRawColumns = useMemo(() => rawColumns, [JSON.stringify(rawColumns.map((c: Column) => c.id))]);

  // Use grid column filters hook to avoid code duplication with useTableData
  const { advancedColumnFilters, handleColumnFilterChange, handleLoadFilterOptions, handleLoadMoreFilterOptions } =
    useGridColumnFilters({
      columns: stableRawColumns,
      tabId: tabId ? String(tabId) : undefined,
      entityName: entityName ? String(entityName) : undefined,
      setAppliedTableFilters,
      setColumnFilters,
      isImplicitFilterApplied: false,
    });

  // Create a minimal tab object for useColumns with corrected field hqlNames
  const mockTab = useMemo(() => {
    if (!stableWindowReferenceTab?.fields) {
      return {
        id: tabId,
        fields: {},
      } as Tab;
    }

    const correctedFields = Object.fromEntries(
      Object.entries(stableWindowReferenceTab.fields)
        .filter(([_, f]) => isFieldVisible(f))
        .map(([key, field]) => {
          // Check if hqlName looks like a display name (has spaces, starts with uppercase, etc)
          const isDisplayName =
            field.hqlName.includes(" ") || field.hqlName.includes(".") || /^[A-Z]/.test(field.hqlName);

          // Only correct if it's a display name, otherwise keep original
          const actualColumnName = isDisplayName ? field.column?._identifier || key || field.hqlName : field.hqlName;

          return [
            key,
            {
              ...field,
              hqlName: actualColumnName,
            },
          ];
        })
    );

    return {
      ...stableWindowReferenceTab,
      id: stableWindowReferenceTab.id || tabId,
      fields: correctedFields,
    } as Tab;
  }, [stableWindowReferenceTab, tabId, isFieldVisible]);

  // Get columns with filter handlers using useColumns
  // Pass options as stable reference to avoid re-creating columns unnecessarily
  const columnOptions = useMemo(
    () => ({
      onColumnFilter: handleColumnFilterChange,
      onLoadFilterOptions: handleLoadFilterOptions,
      onLoadMoreFilterOptions: handleLoadMoreFilterOptions,
      columnFilterStates: advancedColumnFilters,
    }),
    [handleColumnFilterChange, handleLoadFilterOptions, handleLoadMoreFilterOptions, advancedColumnFilters]
  );

  const finalFields = useMemo(() => {
    return stableVisibleFields.length > 0 ? stableVisibleFields : fields || [];
  }, [stableVisibleFields, fields]);

  // Use refs for fields and handler to pass to context
  const fieldsRef = useRef(finalFields);
  useEffect(() => {
    fieldsRef.current = finalFields;
  }, [finalFields]);

  // We already have handleRecordChangeRef from line 612!
  // But line 612 ref is internal to the hook logic. We need to expose it.
  // Actually, we can just pass handleRecordChangeRef (the one defined at 612) to the context.

  const columnsFromHook = useColumns(mockTab, columnOptions);

  // handleRecordChange is defined later using refs for stability
  // We use a ref to expose it to columns if needed before definition (though unlikely with current flow)
  const handleRecordChangeRef = useRef<((row: any, changes: any) => void) | null>(null);

  const columns = useMemo(() => {
    const finalColumns = columnsFromHook.length > 0 ? columnsFromHook : rawColumns;

    // DON'T change column IDs - they need to match the data keys from datasource
    // The accessorFn in parseColumns already handles data mapping using hqlName

    // Merge filterFieldName from rawColumns into finalColumns
    const columnsWithFilterFieldName = finalColumns.map((col: Column) => {
      const rawCol = rawColumns.find((r: Column) => r.header === col.header);
      return {
        ...col,
        filterFieldName: (rawCol as any)?.filterFieldName || col.columnName,
      };
    });

    // Ensure all columns have filtering enabled (either dropdown or text) and custom editing
    const columnsWithFilters = columnsWithFilterFieldName.map((col: Column) => {
      // Base config - start with existing column
      let columnConfig = { ...col };

      // If column doesn't have a Filter component (dropdown), enable simple text filtering
      if (!columnConfig.Filter) {
        columnConfig = {
          ...columnConfig,
          enableColumnFilter: true,
          columnFilterModeOptions: ["contains", "startsWith", "endsWith"],
          filterFn: "contains",
          muiTableBodyCellEditTextFieldProps: ({ cell }: { cell: any }) => {
            // Helper to determine if column is boolean-like
            const isBoolean =
              columnConfig.type === "boolean" ||
              columnConfig.column?.reference === "20" ||
              columnConfig.column?._identifier === "YesNo" ||
              ["Y", "N"].includes(String(cell.getValue()));

            if (isBoolean) {
              return {
                select: true,
                children: [
                  <option key="Y" value="Y">
                    Yes
                  </option>,
                  <option key="N" value="N">
                    No
                  </option>,
                ],
                SelectProps: {
                  native: true,
                },
              };
            }
            return {};
          },
        };
      }

      // ALWAYS add custom editing logic (Edit and enableEditing)
      // This ensures our CellEditorFactory is used for all columns, including those with Filters (TableDir, etc.)
      return {
        ...columnConfig,
        enableEditing: () => {
          // Basic read-only check based on field definition
          // Ideally this should use field.readOnly or similar prop if available
          const isReadOnly = columnConfig.readOnly || columnConfig.isReadOnly;
          if (isReadOnly) return false;

          if (columnConfig.columnName === "id" || columnConfig.columnName.includes("identifier")) return false;

          return true;
        },
        // Use custom editor for both display (Cell) and editing (Edit) to ensure "always edit" feel
        // This matches user request: "puts you in edit mode immediately"
        // Use stable static component for editing
        Edit: StableGridCellEditorRenderer,
        // Pass context via column definition
        dbColumnName: parameter.dBColumnName,
        // For display (Cell), only show editor if row is selected OR for specific grids like glItem
        // Otherwise use default display
        Cell: InteractiveGridCellRenderer,
      };
    });

    // Sort the final columns based on gridPosition
    // We access the original fields from stableWindowReferenceTab
    const sortedColumns = columnsWithFilters.sort((a: Column, b: Column) => {
      // Find field definition for column A
      const fieldA = Object.values(stableWindowReferenceTab?.fields || {}).find(
        (f) => f.name === a.header || f.hqlName === a.columnName
      );
      // Find field definition for column B
      const fieldB = Object.values(stableWindowReferenceTab?.fields || {}).find(
        (f) => f.name === b.header || f.hqlName === b.columnName
      );

      const posA = fieldA?.gridPosition ?? fieldA?.sequenceNumber ?? 0;
      const posB = fieldB?.gridPosition ?? fieldB?.sequenceNumber ?? 0;

      return posA - posB;
    });

    return sortedColumns;
  }, [columnsFromHook, rawColumns, stableWindowReferenceTab]);

  const shouldSkipFetch = !isDataReady || processConfigLoading || !entityName;

  const {
    records: rawRecords,
    loading: datasourceLoading,
    error: datasourceError,
    refetch,
    hasMoreRecords,
    fetchMore,
    addRecordLocally,
  } = useDatasource({
    entity: String(entityName),
    params: datasourceOptions,
    columns: rawColumns,
    activeColumnFilters: appliedTableFilters,
    skip: shouldSkipFetch,
  });

  // Ref to track if we have performed initial auto-selection from context
  const autoSelectInit = useRef(false);

  // Sync external gridSelection changes and handle Context Auto-Selection
  useEffect(() => {
    const externalSelection = gridSelection[parameter.dBColumnName]?._selection || [];

    // 1. External Grid Selection (Priority: Callouts/State updates)
    if (externalSelection.length > 0) {
      const newRowSelection: MRT_RowSelectionState = {};
      for (const item of externalSelection) {
        const itemId = String(item.id);
        newRowSelection[itemId] = true;
      }
      setRowSelection(newRowSelection);
      autoSelectInit.current = true;
      return;
    }

    // 2. Default/Parent Context Selection Logic (Initialization Only)
    // Only run this if we haven't successfully initialized selection yet
    if (!autoSelectInit.current) {
      const { parentContextId, contextDocNo } = resolveParentContextId(
        parameter.dBColumnName,
        effectiveRecordValues,
        currentValues
      );

      if (parentContextId || contextDocNo) {
        // 3. Notify Parent & Select Visual Row
        // We MUST wait for records to load to match the context (Order) to the specific Grid Row (Schedule)
        const fullRecord = findMatchingRecord(rawRecords, parentContextId, contextDocNo);

        if (fullRecord) {
          const recordId = String(fullRecord.id);
          // CRITICAL: Select the ID of the record we FOUND, not the Context ID.
          setRowSelection({ [recordId]: true });

          setTimeout(() => {
            if (onSelectionChange) {
              // Use updater function to preserve other grids in gridSelection
              onSelectionChange((prev: GridSelectionStructure) => ({
                ...prev,
                [parameter.dBColumnName]: {
                  _selection: [fullRecord],
                  _allRows: rawRecords, // Provide context
                },
              }));
            }
          }, 0);
          autoSelectInit.current = true;
        }
      }
    }
  }, [
    gridSelection,
    parameter.dBColumnName, // stable
    effectiveRecordValues,
    currentValues,
    rawRecords,
    onSelectionChange,
    parameter, // less stable but needed
  ]);

  // Stabilize records reference using JSON comparison to prevent unnecessary re-renders
  const [localRecords, setLocalRecords] = useState<EntityData[]>([]);
  const rawRecordsStringRef = useRef<string>("");

  // Sync with datasource (rawRecords)
  useEffect(() => {
    // Only update if rawRecords actually changed content
    const rawString = JSON.stringify(rawRecords || []);
    if (rawString !== rawRecordsStringRef.current) {
      rawRecordsStringRef.current = rawString;
      setLocalRecords(rawRecords || []);
    }
  }, [rawRecords]);

  // Ref to track last processed selection to prevent redundant updates
  const lastSelectionStringRef = useRef<string>("");

  // Sync with external updates via gridSelection (e.g. Callouts modifying data)
  useEffect(() => {
    // When PayScript engine runs, it returns the *updated selection* in gridSelection.
    const gridData = gridSelection[parameter.dBColumnName];
    // Only process if we have a valid selection array (even empty)
    if (!gridData || !gridData._selection || !localRecords.length) return;

    const externalSelection = gridData._selection;

    // OPTIMIZATION: Check if selection actually changed for THIS grid
    // We include amounts in the check because engine updates amounts. Also check paymentAmount.
    const selectionString = JSON.stringify(externalSelection.map((s: any) => `${s.id}-${s.amount}-${s.paymentAmount}`));
    if (selectionString === lastSelectionStringRef.current) {
      return;
    }
    lastSelectionStringRef.current = selectionString;

    syncGridSelectionToLocalRecords(externalSelection, localRecords, setLocalRecords);
  }, [gridSelection, parameter.dBColumnName]); // localRecords omitted to prevent cycle

  const records = localRecords;

  // Populate _allRows when records are loaded
  useEffect(() => {
    // For glitem, we want to allow empty lists initially
    if (!records) return;

    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        ...prev[parameter.dBColumnName],
        _allRows: records,
      },
    }));
  }, [records, onSelectionChange, parameter.dBColumnName]);

  // Reset selection and filters on mount or when entity changes
  useEffect(() => {
    setRowSelection({});
    setColumnFilters([]);
    setAppliedTableFilters([]);
    // Call onSelectionChange with the structure for this entityName
    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        _selection: [],
        _allRows: [],
      },
    }));
  }, [onSelectionChange, entityName, parameter.dBColumnName]);

  const handleMRTColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      const newColumnFilters = typeof updaterOrValue === "function" ? updaterOrValue(columnFilters) : updaterOrValue;
      setColumnFilters(newColumnFilters);
      setAppliedTableFilters(newColumnFilters);
    },
    [columnFilters]
  );

  const handleRowSelection = useCallback(
    (updaterOrValue: MRT_RowSelectionState | ((prev: MRT_RowSelectionState) => MRT_RowSelectionState)) => {
      const newSelection = typeof updaterOrValue === "function" ? updaterOrValue(rowSelection) : updaterOrValue;

      // 1. Prepare new records state first to ensure synchronous consistency
      let recordsChanged = false;
      const newRecords = records.map((record) => {
        const recordId = String(record.id);
        const isSelected = newSelection[recordId];

        // Aggressively reset amount to 0 if deselected, regardless of current value
        // Also handle 'paymentAmount' field which is used by Credit grid in Classic
        if (!isSelected) {
          let changed = false;
          if (record.amount !== undefined && record.amount !== 0) {
            record = { ...record, amount: 0 };
            changed = true;
          }
          if (record.paymentAmount !== undefined && record.paymentAmount !== 0) {
            record = { ...record, paymentAmount: 0 };
            changed = true;
          }
          if (changed) recordsChanged = true;
        }
        return record;
      });

      // 2. Update local state if needed
      if (recordsChanged) {
        setLocalRecords(newRecords);
      }
      setRowSelection(newSelection);

      // 3. Calculate selected subset from the NEW records
      const selectedItems = newRecords.filter((record) => {
        const recordId = String(record.id);
        return newSelection[recordId];
      });

      // 4. Propagate to parent with the updated (zeroed) records
      onSelectionChange((prev: GridSelectionStructure) => ({
        ...prev,
        [parameter.dBColumnName]: {
          _selection: selectedItems,
          _allRows: newRecords,
        },
      }));
    },
    [rowSelection, records, onSelectionChange, parameter.dBColumnName]
  );

  const handleClearSelections = useCallback(() => {
    setRowSelection({});
    // Clear selections for this entityName
    onSelectionChange((prev: GridSelectionStructure) => ({
      ...prev,
      [parameter.dBColumnName]: {
        _selection: [],
        _allRows: records,
      },
    }));
  }, [onSelectionChange, parameter.dBColumnName, records]);

  const handleRowClick = useCallback(
    (row: MRT_Row<EntityData>, event?: React.MouseEvent) => {
      // Prevent toggling selection if clicking on an interactive element
      const target = event?.target as HTMLElement;
      if (target) {
        // Check if clicking inside interactive elements or their children (e.g. SVG inside Button)
        if (
          target.closest("input") ||
          target.closest("select") ||
          target.closest("textarea") ||
          target.closest("button") ||
          target.isContentEditable
        ) {
          return;
        }

        // Check for specific roles often used in complex UI components
        const role = target.getAttribute("role");
        if (role === "combobox" || role === "listbox" || role === "option" || role === "button") {
          return;
        }

        // Broad check for MUI and generic interactive wrappers
        if (
          target.closest(".MuiInputBase-root") ||
          target.closest(".etendo-input-wrapper") ||
          target.closest(".MuiFormControl-root") ||
          target.closest(".MuiAutocomplete-root") ||
          target.closest('[role="combobox"]') ||
          target.closest(".react-select__control") ||
          target.closest(".etendo-combobox")
        ) {
          return;
        }
      }

      setRowSelection((prev) => {
        const newSelection = { ...prev };
        newSelection[row.id] = !newSelection[row.id];

        const selectedItems = records.filter((record) => {
          const recordId = String(record.id);
          return newSelection[recordId];
        });

        // Update with the new structure
        onSelectionChange((prev: GridSelectionStructure) => ({
          ...prev,
          [parameter.dBColumnName]: {
            _selection: selectedItems,
            _allRows: records,
          },
        }));

        return newSelection;
      });
    },
    [records, onSelectionChange, parameter.dBColumnName]
  );

  const handleCreateRow = useCallback(
    async ({ values, table, row }: any) => {
      if (!stableWindowReferenceTab) return;

      // Merge values: explicit edits (row.original) take precedence over MRT tracked values
      const newValues = { ...values, ...(row?.original || {}) };

      // Special logic for G/L Items (and potentially others in the future)
      // These should be saved LOCALLY to the grid, not sent to the backend immediately.
      if (parameter.dBColumnName === "glitem") {
        // Generate a pseudo-UUID
        const generateUUID = () => {
          // Use crypto.randomUUID if available for better entropy and collision resistance
          if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID().replace(/-/g, "").toUpperCase();
          }
          // Fallback for environments where crypto is not available
          return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx"
            .replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c == "x" ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            })
            .toUpperCase();
        };

        const newId = generateUUID();
        const newRecord = {
          id: newId,
          ...newValues,
        };

        // Add to local datasource
        // Add to local datasource
        addRecordLocally(newRecord);

        // Auto-select the new record (so it's included in the payload)
        setRowSelection((prev) => ({
          ...prev,
          [newId]: true,
        }));

        table.setCreatingRow(null);
        return;
      }

      // Ensure generic boolean/date conversion if needed
      // Calling generic save operation
      const saveOperation: SaveOperation = {
        rowId: "new",
        isNew: true,
        data: newValues,
      };

      try {
        const result = await saveRecord({
          saveOperation,
          tab: stableWindowReferenceTab,
          userId: user?.id || "0",
        });

        if (result.success) {
          table.setCreatingRow(null);
          refetch();
        } else {
          // Basic error handling mapping
          const errors: Record<string, string | undefined> = {};
          result.errors?.forEach((e) => {
            if (e.field && e.field !== "_general") {
              errors[e.field] = e.message;
            }
          });
          setValidationErrors(errors);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [stableWindowReferenceTab, user, refetch, parameter.dBColumnName, addRecordLocally]
  );

  const handleSaveRow = useCallback(
    async ({ values, row, table }: any) => {
      // Check if this record is local (should be in localRecords)
      // glitem records are always local
      const isLocal = parameter.dBColumnName === "glitem" || localRecords.some((r) => String(r.id) === String(row.id));

      if (isLocal) {
        // IMPORTANT: Since we use custom Cell Editors that modify row.original directly (via handleChange),
        // the 'values' object passed by MRT might NOT contain the latest changes if MRT didn't detect them.
        // We MUST use row.original which our editors updated.
        // We ignore 'values' entirely because it might be stale or contain default garbage.
        const newValues = { ...row.original };

        // Update local state
        setLocalRecords((prev) => prev.map((r) => (String(r.id) === String(row.id) ? { ...r, ...newValues } : r)));

        // Also update gridSelection if the row is currently selected, to keep process payload in sync
        if (rowSelection[row.id]) {
          onSelectionChange((prev: GridSelectionStructure) => {
            const currentSelection = prev[parameter.dBColumnName]?._selection || [];
            // Update the item in the selection array
            const updatedSelection = currentSelection.map((item) =>
              String(item.id) === String(row.id) ? { ...item, ...newValues } : item
            );

            return {
              ...prev,
              [parameter.dBColumnName]: {
                ...prev[parameter.dBColumnName],
                _selection: updatedSelection,
                // We also update _allRows just in case, though it usually mirrors localRecords which we just updated via props?
                // No, localRecords is state here. Syncing _allRows is good practice.
                _allRows:
                  prev[parameter.dBColumnName]?._allRows?.map((item) =>
                    String(item.id) === String(row.id) ? { ...item, ...newValues } : item
                  ) || [],
              },
            };
          });
        }

        table.setEditingRow(null);
        return;
      }

      // If NOT local, we might need to handle backend update logic, but for now we focus on fixing the glitem revert issue.
      table.setEditingRow(null);
    },
    [localRecords, parameter.dBColumnName, rowSelection, onSelectionChange]
  );

  const handleAddNewRecord = useCallback(() => {
    // Logic for adding new empty record to localRecords directly
    const generateUUID = () => {
      // Distinct implementation for local temporary records
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substring(2, 10);
      return `local_${timestamp}_${randomPart}`.toUpperCase();
    };

    const newId = generateUUID();
    const newRecord = {
      id: newId,
    };

    // Add to local datasource
    addRecordLocally(newRecord);

    // Auto-select
    setRowSelection((prev) => ({
      ...prev,
      [newId]: true,
    }));
  }, [addRecordLocally]);

  // Refs for state accessed in handlers to allow stable handler identity
  const localRecordsRef = useRef(localRecords);
  const rowSelectionRef = useRef(rowSelection);
  // Ensure refs are always up to date
  useEffect(() => {
    localRecordsRef.current = localRecords;
    rowSelectionRef.current = rowSelection;
  }, [localRecords, rowSelection]);

  // Stable handler using refs
  const handleRecordChange = useCallback(
    (row: any, changes: any) => {
      const records = localRecordsRef.current;
      const selection = rowSelectionRef.current;

      if (parameter.dBColumnName !== "glitem" && !records.some((r) => String(r.id) === String(row.id))) return;

      // Update state (trigger re-render)
      setLocalRecords((prev) => prev.map((r) => (String(r.id) === String(row.id) ? { ...r, ...changes } : r)));

      // Update selection if selected (read from ref)
      if (selection[row.id]) {
        onSelectionChange((prev: GridSelectionStructure) => {
          const currentSelection = prev[parameter.dBColumnName]?._selection || [];
          const updatedSelection = currentSelection.map((item) =>
            String(item.id) === String(row.id) ? { ...item, ...changes } : item
          );
          return {
            ...prev,
            [parameter.dBColumnName]: {
              ...prev[parameter.dBColumnName],
              _selection: updatedSelection,
              _allRows:
                prev[parameter.dBColumnName]?._allRows?.map((item) =>
                  String(item.id) === String(row.id) ? { ...item, ...changes } : item
                ) || [],
            },
          };
        });
      }
    },
    [parameter.dBColumnName, onSelectionChange]
  ); // Dependencies are now minimal and stable

  // Update the ref exposed to context
  useEffect(() => {
    handleRecordChangeRef.current = handleRecordChange;
  }, [handleRecordChange]);

  useEffect(() => {
    handleRecordChangeRef.current = handleRecordChange;
  }, [handleRecordChange]);

  // Context value for GridCellEditor components (defined here to capture handleRecordChangeRef)
  const gridContextValue = useMemo(
    () => ({
      effectiveRecordValuesRef,
      parametersRef,
      fieldsRef,
      handleRecordChangeRef,
      validationsRef,
      validations,
      session,
      tabId,
    }),
    [tabId, session, validations]
  );

  const finalColumns = useMemo(() => {
    const windowReferenceTab = parameter.window?.tabs?.[0];
    let fields: any[] = [];
    if (windowReferenceTab?.fields) {
      if (Array.isArray(windowReferenceTab.fields)) {
        fields = windowReferenceTab.fields;
      } else {
        fields = Object.values(windowReferenceTab.fields);
      }
    }

    return columns
      .filter((c) => c.id !== "actions")
      .map((col) => {
        // Identify if column corresponds to a Read-Only field
        let isReadOnly = false;
        if (fields.length > 0) {
          const colDef = col as MRT_ColumnDef<EntityData>;
          const field = fields.find((f: any) => {
            if (colDef.accessorKey) {
              if (f.columnName === colDef.accessorKey) return true;
              if (f.inpColumnName === colDef.accessorKey) return true;
              if (f.hqlName === colDef.accessorKey) return true;
            }
            if (col.header && f.name === col.header) return true;
            return false;
          });

          if (field) {
            // Check explicit metadata
            if (field.readOnly === true || field.isReadOnly === true || field.uIPattern === "RO") {
              isReadOnly = true;
            }
          }
        }

        const newCol: any = {
          ...col,
          enableEditing: isReadOnly ? false : col.enableEditing,
          onRecordChange: handleRecordChange,
        };

        if (isReadOnly) {
          // For Read-Only fields, override the Cell renderer
          newCol.Cell = ReadOnlyCellRenderer;
          // Ensure Edit component is removed so it cannot be triggered
          newCol.Edit = undefined;
        } else if (!newCol.Cell) {
          // If no cell renderer set (and not read-only), ensure we use our interactive one for consistency
          // Note: columns usually have default or custom cell renderers set in useColumns or earlier logic
        }

        return newCol;
      });
  }, [columns, handleRecordChange, parameter.window]);

  const renderTopToolbar = useCallback(
    (props: MRT_TopToolbarProps<EntityData>) => {
      const selectedCount = props.table.getSelectedRowModel().rows.length;
      return (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b max-h-[2.5rem]">
          <div className="text-base font-medium text-gray-800">{parameter.name}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (parameter.dBColumnName === "glitem") {
                  handleAddNewRecord();
                } else {
                  props.table.setCreatingRow(true);
                }
              }}
              className="hidden flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
              <PlusIcon className="w-4 h-4" data-testid="PlusIcon__ce8544" />
              {/* @ts-ignore */}
              <span>{t("common.new")}</span>
            </button>
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedCount} {t("table.selection.multiple")}
                </span>
                <button
                  type="button"
                  onClick={handleClearSelections}
                  className="px-3 py-1 text-sm cursor-pointer text-gray-700 border border-gray-300 rounded-full hover:bg-(--color-etendo-main) hover:text-(--color-baseline-0) transition-colors">
                  {t("common.clear")}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    },
    [parameter.name, t, handleClearSelections]
  );

  const LoadMoreButton = ({ fetchMore }: { fetchMore: () => void }) => (
    <div className="flex justify-center p-2 border-t border-gray-200">
      <button
        type="button"
        onClick={fetchMore}
        className="px-4 py-2 text-sm border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100 transition-colors">
        {t("common.loadMore")}
      </button>
    </div>
  );

  const tableOptions: MRT_TableOptions<EntityData> = useMemo(
    () => ({
      muiTablePaperProps: {
        className: tableStyles.paper,
        style: {
          borderRadius: "1rem",
          boxShadow: "none",
        },
      },
      muiTableHeadCellProps: {
        className: tableStyles.headCell,
      },
      muiTableBodyCellProps: {
        className: tableStyles.bodyCell,
      },
      muiTableBodyProps: {
        className: tableStyles.body,
      },
      muiTableBodyRowProps: ({ row }) => {
        return {
          onClick: (event) => handleRowClick(row, event),
          className: rowSelection[row.id]
            ? "bg-blue-50 hover:bg-blue-100 cursor-pointer"
            : "hover:bg-gray-50 cursor-pointer",
        };
      },
      muiTableContainerProps: {
        className: tableStyles.container,
        style: {
          minHeight: "300px",
          maxHeight: "500px",
        },
      },
      layoutMode: "semantic",
      enableColumnResizing: true,
      enableGlobalFilter: false,
      enableRowSelection: true,
      enableMultiRowSelection: true,
      positionToolbarAlertBanner: "none",
      enablePagination: false,
      enableStickyHeader: true,
      enableStickyFooter: true,
      enableColumnFilters: true,
      enableSorting: true,
      enableColumnActions: true,
      manualFiltering: true,
      columns: finalColumns, // Use modified columns with handler
      data: records || [],
      getRowId: (row) => String(row.id),
      renderTopToolbar,
      renderBottomToolbar: hasMoreRecords
        ? () => <LoadMoreButton fetchMore={fetchMore} data-testid="LoadMoreButton__ce8544" />
        : undefined,
      renderEmptyRowsFallback: () => (
        <div className="flex justify-center items-center p-8 text-gray-500">
          <EmptyState maxWidth={MAX_WIDTH} data-testid="EmptyState__ce8544" />
        </div>
      ),
      initialState: {
        density: "compact",
      },
      state: {
        rowSelection,
        columnFilters,
        showColumnFilters: true,
      },
      onRowSelectionChange: handleRowSelection,
      onColumnFiltersChange: handleMRTColumnFiltersChange,
      enableEditing: (row) => {
        // Robust check for row editability based on field metadata
        const hasEditableField = finalColumns.some((col) => {
          if (col.id === "mrt-row-actions" || col.id === "mrt-row-select") return false;

          // Check explicit enableEditing flag
          if (col.enableEditing === false) return false;

          // Find corresponding field in tab definition
          // windowReferenceTab.fields can be an array or object map depending on context
          // Determine fields array for validation
          let fields: any[] = [];
          if (windowReferenceTab?.fields) {
            if (Array.isArray(windowReferenceTab.fields)) {
              fields = windowReferenceTab.fields;
            } else {
              fields = Object.values(windowReferenceTab.fields);
            }
          }

          const field = fields.find(
            (f: any) =>
              f.columnName === col.accessorKey ||
              f.inpColumnName === col.accessorKey ||
              f.hqlName === col.accessorKey || // Matches property name like 'businessPartner'
              f.name === col.header
          );

          if (!field) {
            // If we can't find field metadata, assume it follows col.enableEditing
            // Default to false for unknown text columns to prevent "fake" editing of labels
            return col.enableEditing === true;
          }

          // Check Read Only status
          // @ts-ignore
          if (field.readOnly === true || field.isReadOnly === true || field.uIPattern === "RO") {
            return false;
          }

          return true; // Found at least one editable field
        });

        return hasEditableField;
      },
      createDisplayMode: "row",
      editDisplayMode: "cell",
      enableRowActions: false, // Ensure this is false to hide the actions column
      positionActionsColumn: "first",
      onCreatingRowSave: handleCreateRow,
      onCreatingRowCancel: () => setValidationErrors({}),
      onEditingRowSave: handleSaveRow, // Handle standard row saves
      onEditingRowCancel: () => setValidationErrors({}),
    }),
    [
      finalColumns,
      records,
      rowSelection,
      columnFilters,
      hasMoreRecords,
      renderTopToolbar,
      fetchMore,
      handleRowSelection,
      handleMRTColumnFiltersChange,
      handleRowClick,
      handleCreateRow,
      handleSaveRow,
    ]
  );

  const table = useMaterialReactTable(tableOptions);

  // Separate initial loading from filter/refresh loading
  // Only show loading spinner on initial load, not on filter changes
  const isInitialLoading = (tabLoading || processConfigLoading || !isDataReady) && !records;
  const error = tabError || processConfigError || datasourceError;

  if (isInitialLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Loading data-testid="Loading__ce8544" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title={t("errors.missingData")}
        description={error?.message}
        showRetry
        onRetry={refetch}
        data-testid="ErrorDisplay__ce8544"
      />
    );
  }

  // Only show EmptyState if there are no columns (configuration error)
  // If there are columns but no records, show the table with empty state inside
  if ((!columns || columns.length === 0) && !tabLoading && !processConfigLoading) {
    return <EmptyState maxWidth={MAX_WIDTH} data-testid="EmptyState__ce8544" />;
  }

  return (
    <WindowReferenceGridProvider value={gridContextValue} data-testid="WindowReferenceGridProvider__ce8544">
      <div
        className={`flex flex-col w-full overflow-hidden max-h-4xl h-full transition duration-100 ${
          datasourceLoading ? "opacity-40 cursor-wait cursor-to-children" : "opacity-100"
        }`}
        ref={contentRef}>
        <MaterialReactTable table={table} data-testid="MaterialReactTable__ce8544" />
      </div>
    </WindowReferenceGridProvider>
  );
};

export default WindowReferenceGrid;
