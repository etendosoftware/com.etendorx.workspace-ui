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
} from "material-react-table";
import { useDatasource } from "@/hooks/useDatasource";
import { useGridColumnFilters } from "@/hooks/table/useGridColumnFilters";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { useColumns } from "@/hooks/table/useColumns";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorDisplay } from "../ErrorDisplay";
import EmptyState from "../Table/EmptyState";
import Loading from "../loading";
import { tableStyles } from "./styles";
import type { WindowReferenceGridProps } from "./types";
import { PROCESS_DEFINITION_DATA } from "@/utils/processes/definition/constants";
import type { GridSelectionStructure } from "./ProcessDefinitionModal";
import PlusIcon from "../../../ComponentLibrary/src/assets/icons/plus.svg";
import { saveRecord } from "../Table/utils/saveOperations";
import type { SaveOperation } from "../Table/types/inlineEditing";
import { useUserContext } from "@/hooks/useUserContext";

const MAX_WIDTH = 100;
const PAGE_SIZE = 100;

/**
 * WindowReferenceGrid Component
 * Displays a grid of referenced records that can be selected
 */
// Editor component removed in favor of CellEditorFactory logic inside WindowReferenceGrid
import { CellEditorFactory } from "../Table/CellEditors";
import { getFieldReference } from "@/utils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { FieldType } from "@workspaceui/api-client/src/api/types";

// Extracted Editor Component
const GridCellEditor = ({
  cell,
  row,
  col,
  fields,
  tabId,
  effectiveRecordValues,
  parameters,
}: {
  cell: any;
  row: any;
  col: any;
  fields: any[];
  tabId: string | undefined;
  effectiveRecordValues: any;
  parameters: any;
}) => {
  const { session } = useUserContext();

  // Find matched field definition
  const matchingField =
    fields.find((f) => f.name === col.header) ||
    fields.find((f) => f.columnName === col.columnName) ||
    (col.columnName.endsWith("_ID") ? fields.find((f) => f.columnName === col.columnName) : undefined);

  if (!matchingField) {
    return null; // Return null instead of undefined for React component
  }

  // Robustly resolve reference code, checking both column and field level
  const reference = matchingField.column?.reference || (matchingField as any).reference;
  const fieldType = getFieldReference(reference);

  const handleChange = (newValue: any, selectedOption?: any) => {
    row.original[col.columnName] = newValue;

    // Identifier update logic for TableDir/Search
    if (
      selectedOption &&
      (fieldType === FieldType.TABLEDIR ||
        fieldType === FieldType.SEARCH ||
        reference === FIELD_REFERENCE_CODES.PRODUCT ||
        reference === FIELD_REFERENCE_CODES.SELECTOR)
    ) {
      const identifierKey = `${col.columnName}$_identifier`;
      row.original[identifierKey] = selectedOption.label || selectedOption._identifier;
    }
    cell.row._valuesCache[cell.column.id] = newValue;
  };

  const loadOptions = async (field: any, searchQuery?: string) => {
    try {
      // Logic based on useTableDirDatasource
      const fieldRef = field.column?.reference || (field as any).reference;
      const isSelector = fieldRef === FIELD_REFERENCE_CODES.SELECTOR || fieldRef === FIELD_REFERENCE_CODES.PRODUCT;
      const selectorId = field.selector?._selectorDefinitionId;
      const datasourceName = field.selector?.datasourceName;

      // Determine base URL and body
      // If we have a specific datasource name (New UI Selectors), use it
      // Otherwise fallback to legacy Generic DataSource
      const apiUrl = datasourceName
        ? `/api/datasource/${datasourceName}`
        : `/sws/com.etendorx.das.legacy.utils/datasource/${field.columnName || field.name}`;

      const criteria: any[] = [];

      // Basic search criteria
      if (searchQuery) {
        criteria.push({
          fieldName: "name", // Default, but useTableDirDatasource checks extraSearchFields
          operator: "iContains",
          value: searchQuery,
        });
      }

      // Construct payload similar to useTableDirDatasource
      const payload: any = {
        _startRow: "0",
        _endRow: "75",
        _operationType: "fetch",
        moduleId: field.module,
        windowId: tabId,
        tabId: field.tab || tabId,
        inpTabId: field.tab || tabId,
        inpwindowId: tabId,
        inpTableId: field.column?.table,
        initiatorField: field.hqlName,
        _constructor: "AdvancedCriteria",
        _OrExpression: "true",
        operator: "or",
        _org: effectiveRecordValues?.inpadOrgId || session.adOrgId,
        // Specific for pick and execute processes
        inpPickAndExecuteTableId: effectiveRecordValues?.inpTableId,
        ...effectiveRecordValues,
      };

      // Add parameter values using their DBColumnName
      if (parameters) {
        Object.values(parameters).forEach((param: any) => {
          const paramValue = effectiveRecordValues?.[param.name];
          if (paramValue !== undefined && paramValue !== null && param.dBColumnName) {
            payload[param.dBColumnName] = paramValue;
          }
        });
      }

      if (isSelector && field.selector) {
        payload._noCount = "true";

        if (field.selector.filterClass) {
          payload.filterClass = field.selector.filterClass;
        }
        if (field.selector._selectedProperties) {
          payload._selectedProperties = field.selector._selectedProperties;
        }
        if (field.selector._selectorDefinitionId) {
          payload._selectorDefinitionId = field.selector._selectorDefinitionId;
        }
        if (field.selector._extraProperties) {
          payload._extraProperties = field.selector._extraProperties;
        }
        if (field.selector._sortBy) {
          payload._sortBy = field.selector._sortBy;
        }
      } else if (isSelector) {
        // Fallback for selectors without detailed metadata
        payload._noCount = "true";
        if (selectorId) {
          payload._selectorDefinitionId = selectorId;
        }
      } else {
        payload._textMatchStyle = "substring";
      }

      const params = new URLSearchParams();

      // Add base payload
      Object.keys(payload).forEach((key) => {
        // Filter out undefined/null and objects (except criteria which we handle separately if needed)
        if (payload[key] !== undefined && payload[key] !== null && typeof payload[key] !== "object") {
          params.append(key, String(payload[key]));
        }
      });

      // Properly serialize criteria if it exists
      if (criteria.length > 0) {
        // For legacy/standard datasources, criteria often goes as JSON string in 'criteria' param
        // But AdvancedCriteria usually expects _constructor etc.
        // We will append individual criteria parts if using AdvancedCriteria structure in basics
        // Or just standard criteria param
        params.append(
          "criteria",
          JSON.stringify({
            fieldName: "_dummy",
            operator: "equals",
            value: new Date().getTime(),
            _constructor: "AdvancedCriteria",
            criteria: criteria,
          })
        );
      } else {
        // dummy criteria to satisfy some backend requirements if needed, or just skip
      }

      if (searchQuery) {
        params.append("_sortBy", "_identifier");
      }

      // Use datasource client if available (or fetch with auth)
      const fullUrl = `${apiUrl}?${params.toString()}`;

      // Switch to POST if generic legacy supports it, but standard GET usually for these selectors unless huge params
      // Using RequestInit compatible structure
      const response = await datasource.client.request(fullUrl, {
        method: "GET",
        // Headers like Authorization are handled by the client
      });

      const data = response.data;
      const responseData = data.response?.data || data.data || [];

      return responseData.map((item: any) => ({
        id: item.id,
        value: item.id,
        label: item._identifier || item.name || item.id,
        ...item,
      }));
    } catch (e) {
      console.error("Error loading options", e);
      return [];
    }
  };

  return (
    <div className="w-full min-w-[200px]">
      <CellEditorFactory
        fieldType={fieldType}
        value={cell.getValue()}
        onChange={handleChange}
        field={{ ...matchingField, type: fieldType }}
        rowId={row.id}
        columnId={cell.column.id}
        loadOptions={loadOptions}
        disabled={false}
        hasError={false}
        onBlur={() => {}}
        data-testid="CellEditorFactory__ce8544"
      />
    </div>
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

function WindowReferenceGrid({
  parameter,
  parameters,
  onSelectionChange,
  gridSelection,
  tabId,
  entityName,
  windowReferenceTab,
  processConfig,
  processConfigLoading,
  processConfigError,
  recordValues,
  currentValues,
}: WindowReferenceGridProps) {
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

  const datasourceOptions = useMemo(() => {
    const processId = processConfig?.processId;
    const currentOptionData = PROCESS_DEFINITION_DATA[processId as keyof typeof PROCESS_DEFINITION_DATA];
    const defaultKeys = currentOptionData?.defaultKeys;
    const dynamicKeys = currentOptionData?.dynamicKeys;
    const staticOptions = currentOptionData?.staticOptions;

    const options: Record<string, EntityValue> = {
      ...staticOptions,
      tabId: parameter.tab || tabId,
      pageSize: PAGE_SIZE,
    };

    const applyDynamicKeys = () => {
      if (!dynamicKeys || !effectiveRecordValues) return;

      for (const [key, value] of Object.entries(dynamicKeys)) {
        if (typeof value === "string") {
          const recordValue = effectiveRecordValues[value];

          if (recordValue === "Y") {
            options[key] = true;
          } else if (recordValue === "N") {
            options[key] = false;
          } else {
            options[key] = recordValue || "";
          }
        } else if (typeof value === "boolean") {
          options[key] = value;
        }
      }
    };

    const applyStableProcessDefaults = () => {
      if (!stableProcessDefaults || Object.keys(stableProcessDefaults).length === 0) return;

      for (const [key, value] of Object.entries(stableProcessDefaults)) {
        const actualValue =
          typeof value === "object" && value !== null && "value" in value
            ? (value as { value: EntityValue }).value
            : (value as EntityValue);

        const matchingParameter = Object.values(parameters).find((param) => param.name === key);
        const datasourceFieldName = matchingParameter?.dBColumnName || key;

        options[datasourceFieldName] = actualValue;

        if (defaultKeys && key in defaultKeys) {
          const defaultKey = defaultKeys[key as keyof typeof defaultKeys];
          options[defaultKey] = actualValue;
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

    const applyRecordValues = () => {
      if (!parameters || !effectiveRecordValues) return;

      Object.values(parameters).forEach((param: any) => {
        const paramValue = effectiveRecordValues[param.name];
        if (paramValue !== undefined && param.dBColumnName) {
          options[param.dBColumnName] = paramValue;
        }
      });
    };

    applyDynamicKeys();
    applyStableProcessDefaults();
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
    effectiveRecordValues, // Depend on merged values
    parameters,
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

  const fields = useMemo(() => {
    if (stableWindowReferenceTab?.fields) {
      return Object.values(stableWindowReferenceTab.fields).filter((f) => isFieldVisible(f));
    }
    return [];
  }, [stableWindowReferenceTab, isFieldVisible]);

  // Parse raw columns with fix for WindowReferenceGrid
  const rawColumns = useMemo(() => {
    if (fields.length > 0) {
      const { parseColumns } = require("@/utils/tableColumns");
      const parsed = parseColumns(fields);

      // Add filterFieldName to each column for backend filtering
      // This is needed because some processes have hqlName as display names
      const enriched = parsed.map((col: Column) => {
        const matchingField = fields.find((f) => f.name === col.header);

        // For filtering, we need to check if hqlName is a display name
        const isDisplayName =
          col.columnName.includes(" ") || col.columnName.includes(".") || /^[A-Z]/.test(col.columnName);

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
    });

  // Create a minimal tab object for useColumns with corrected field hqlNames
  const mockTab = useMemo(() => {
    if (!stableWindowReferenceTab?.fields) {
      return {
        id: tabId,
        fields: {},
      } as Tab;
    }

    // Fix hqlName ONLY if it's a display name (contains spaces or starts with uppercase)
    // Some processes have correct hqlName (camelCase like 'organization')
    // Others have incorrect hqlName (display name like 'Organization' or 'Order No.')
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

  const columnsFromHook = useColumns(mockTab, columnOptions);

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
        Edit: ({ cell, row }: { cell: any; row: any }) => (
          <GridCellEditor
            cell={cell}
            row={row}
            col={col}
            fields={fields}
            tabId={tabId}
            effectiveRecordValues={effectiveRecordValues}
            parameters={parameters}
            data-testid="GridCellEditor__ce8544"
          />
        ),
      };
    });

    return columnsWithFilters;
  }, [columnsFromHook, rawColumns]);

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
        const itemId = String((item as EntityData).id);
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
  const recordsStringRef = useRef<string>("");
  const stableRecordsRef = useRef<EntityData[]>([]);

  const records = useMemo(() => {
    const recordsString = JSON.stringify(rawRecords || []);
    if (recordsString !== recordsStringRef.current) {
      recordsStringRef.current = recordsString;
      stableRecordsRef.current = rawRecords || [];
    }
    // If we have no records but we are in a 'local' grid mode (e.g. glitem) we might want to start empty
    // But stable records is just rawRecords.
    return stableRecordsRef.current;
  }, [rawRecords]);

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

      setRowSelection(newSelection);

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
    (row: MRT_Row<EntityData>) => {
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
    async ({ values, table }: any) => {
      if (!stableWindowReferenceTab) return;

      const newValues = { ...values };

      // Special logic for G/L Items (and potentially others in the future)
      // These should be saved LOCALLY to the grid, not sent to the backend immediately.
      if (parameter.dBColumnName === "glitem") {
        // Generate a pseudo-UUID
        const generateUUID = () => {
          return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx"
            .replace(/[xy]/g, function (c) {
              var r = (Math.random() * 16) | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
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

  const renderTopToolbar = useCallback(
    (props: MRT_TopToolbarProps<EntityData>) => {
      const selectedCount = props.table.getSelectedRowModel().rows.length;
      return (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b max-h-[2.5rem]">
          <div className="text-base font-medium text-gray-800">{parameter.name}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => props.table.setCreatingRow(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
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
          onClick: () => handleRowClick(row),
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
      columns,
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
      enableEditing: true,
      createDisplayMode: "row",
      editDisplayMode: "row",
      enableRowActions: true,
      positionActionsColumn: "first",
      onCreatingRowSave: handleCreateRow,
      onCreatingRowCancel: () => setValidationErrors({}),
    }),
    [
      columns,
      records,
      rowSelection,
      columnFilters,
      hasMoreRecords,
      renderTopToolbar,
      fetchMore,
      handleRowSelection,
      handleMRTColumnFiltersChange,
      handleRowClick,
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

  // Only show EmptyState if there are no fields (configuration error)
  // If there are fields but no records, show the table with empty state inside
  // This allows users to clear filters even when no results are found
  if (fields.length === 0 && !tabLoading) {
    return <EmptyState maxWidth={MAX_WIDTH} data-testid="EmptyState__ce8544" />;
  }

  return (
    <div
      className={`flex flex-col w-full overflow-hidden max-h-4xl h-full transition duration-100 ${
        datasourceLoading ? "opacity-40 cursor-wait cursor-to-children" : "opacity-100"
      }`}
      ref={contentRef}>
      <MaterialReactTable table={table} data-testid="MaterialReactTable__ce8544" />
    </div>
  );
}

export default WindowReferenceGrid;
