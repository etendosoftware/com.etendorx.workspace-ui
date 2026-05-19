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

import { memo, useCallback, useRef, useState } from "react";
import { CellEditorFactory } from "../Table/CellEditors";
import { getFieldReference } from "@/utils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { useWindowReferenceGridContext } from "./WindowReferenceGridContext";
import { useTranslation } from "@/hooks/useTranslation";
import SelectorModal from "../Form/FormView/selectors/SelectorModal";
import SearchIcon from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import {
  fetchSelectorDefaultFilters,
  buildCriteriaFromDefaults,
  type SelectorCriteria,
  type DefaultFilterResponse,
} from "@/utils/form/selectors/defaultFilters";
import { buildSelectorDatasourceParams } from "@/utils/form/selectors/selectorColumns";
import { buildSelectorDefaultContext } from "@/utils/form/selectors/utils";
import { buildEtendoContext } from "@/utils/contextUtils";
import { useSelected } from "@/hooks/useSelected";
import { useLanguage } from "@/contexts/language";

// Field name used to attach the user's incremental search query as a criteria
// to selector-definition-backed datasource fetches. Matches the column shown in
// the inline dropdown (`_identifier`) so it filters by what the user sees.
const SEARCH_FIELD_NAME = "_identifier";

// Matches the modal-lupa pipeline (`useDatasource` defaults). Capped at 100 so
// the dropdown stays responsive and aligns with `DEFAULT_PAGE_SIZE` in table
// constants without re-importing it.
const PAGE_SIZE = 100;

type SelectorDefaultsCacheEntry = {
  defaults: DefaultFilterResponse;
  criteria: SelectorCriteria[];
};

const loadSelectorDefaults = async (
  selectorDefinitionId: string,
  context: Record<string, unknown>
): Promise<SelectorDefaultsCacheEntry> => {
  const defaults = await fetchSelectorDefaultFilters(selectorDefinitionId, context);
  const criteria = buildCriteriaFromDefaults(defaults, selectorDefinitionId);
  return { defaults, criteria };
};

// Helper functions extracted to avoid recreation
// biome-ignore lint/suspicious/noExplicitAny: Dynamic payload structure from datasource API
const applyParameters = (payload: any, parameters: any, effectiveRecordValues: any) => {
  if (parameters) {
    // biome-ignore lint/complexity/noForEach: Simple iteration over parameters map
    Object.values(parameters).forEach((param: any) => {
      const paramValue = effectiveRecordValues?.[param.name];
      if (paramValue !== undefined && paramValue !== null && param.dBColumnName) {
        payload[param.dBColumnName] = paramValue;
      }
    });
  }
};

const applySelectorConfig = (payload: any, isSelector: boolean, field: any, selectorId: string | undefined) => {
  if (isSelector) {
    payload._noCount = "true";
    if (field.selector) {
      const selectorProps = [
        "filterClass",
        "_selectedProperties",
        "_selectorDefinitionId",
        "_extraProperties",
        "_sortBy",
      ];
      for (const prop of selectorProps) {
        if (field.selector[prop]) payload[prop] = field.selector[prop];
      }
    } else if (selectorId) {
      payload._selectorDefinitionId = selectorId;
    }
  } else {
    payload._textMatchStyle = "substring";
  }
};

const constructPayload = (
  field: any,
  tabId: string | undefined,
  effectiveRecordValues: any,
  session: any,
  parameters: any,
  isSelector: boolean,
  selectorId: string | undefined,
  shouldSendOrg: boolean
) => {
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
    ...(shouldSendOrg && { _org: effectiveRecordValues?.inpadOrgId || session.adOrgId }),
    inpPickAndExecuteTableId: effectiveRecordValues?.inpTableId,
    ...effectiveRecordValues,
  };

  applyParameters(payload, parameters, effectiveRecordValues);
  applySelectorConfig(payload, isSelector, field, selectorId);

  return payload;
};

const fetchOptionsFromDatasource = async (apiUrl: string, payload: any, searchQuery?: string) => {
  const params = new URLSearchParams();

  for (const key of Object.keys(payload)) {
    if (payload[key] !== undefined && payload[key] !== null && typeof payload[key] !== "object") {
      params.append(key, String(payload[key]));
    }
  }

  const criteria: any[] = [];
  if (searchQuery) {
    criteria.push({
      fieldName: "name",
      operator: "iContains",
      value: searchQuery,
    });
  }

  if (criteria.length > 0) {
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
  }

  if (searchQuery) {
    params.append("_sortBy", "_identifier");
  }

  const fullUrl = `${apiUrl}?${params.toString()}`;
  const response = await datasource.client.request(fullUrl, { method: "GET" });
  return response.data;
};

const mapResponseToOptions = (data: any) => {
  const responseData = data.response?.data || data.data || [];
  return responseData.map((item: any) => ({
    id: item.id,
    value: item.id,
    label: item._identifier || item.name || item.id,
    ...item,
  }));
};

export interface GridCellEditorProps {
  cell: any;
  row: any;
  col: any;
  fields: any[];
  onRecordChange?: (row: any, changes: any) => void;
  // biome-ignore lint/suspicious/noExplicitAny: validation object
  validationError?: any;
  /**
   * When true, paints the cell as errored even without a `validationError`.
   * Used by P&E grids to flag empty mandatory fields in a create-row.
   */
  forceError?: boolean;
  /** Notified after each edit; lets parents clear per-cell create-row errors. */
  onCellEdit?: (columnName: string) => void;
  /**
   * Monotonic counter from the grid context bumped whenever a field-interaction
   * sibling patch is applied (e.g. mutually-exclusive column zeroed). Not read
   * in the component body — its sole purpose is to invalidate the surrounding
   * `memo` comparator so the cell re-renders and re-reads `row.original`. See
   * `WindowReferenceGridContext.siblingPatchVersion`.
   */
  siblingPatchVersion?: number;
}

/**
 * Optimized Grid Cell Editor component
 * Uses context for shared grid data and refs for dynamic data to prevent unnecessary re-renders
 */
const GridCellEditorBase = ({
  cell,
  row,
  col,
  fields,
  onRecordChange,
  validationError,
  forceError,
  onCellEdit,
}: GridCellEditorProps) => {
  const { effectiveRecordValuesRef, parametersRef, tabId, tab, session, fieldReadOnlyMap, shouldSendOrg } =
    useWindowReferenceGridContext();
  const { t } = useTranslation();
  const { graph } = useSelected();
  const { language } = useLanguage();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Memoizes the SelectorDefaultFilterActionHandler response per field so that
  // typing N letters in the dropdown only triggers 1 defaults fetch (not N).
  // Lives on the component instance; cleared when the editor unmounts.
  const defaultsCacheRef = useRef<Map<string, Promise<SelectorDefaultsCacheEntry>>>(new Map());

  // Find matched field definition
  const matchingField =
    fields.find((f) => f.name === col.header) ||
    fields.find((f) => f.columnName === col.columnName) ||
    (col.columnName.endsWith("_ID") ? fields.find((f) => f.columnName === col.columnName) : undefined);

  // Resolve reference code safely
  const reference = matchingField?.column?.reference || (matchingField as any)?.reference;
  const fieldType = getFieldReference(reference);

  const handleChange = useCallback(
    (newValue: any, selectedOption?: any) => {
      row.original[col.columnName] = newValue;
      // Mirror to the DB column name so the display reads the user's edit.
      // parseColumns puts the HQL/property name on `col.columnName` and the DB
      // name on `col.dbColumnName`; `getRawCellValue` (used by the column's
      // accessorFn) reads `value[dbColumnName] ?? value[hqlName]`. Initial 0s
      // seeded by handleAddRow under the DB key would otherwise shadow user
      // edits via the `??` chain (since 0 is not nullish).
      if (col.dbColumnName && col.dbColumnName !== col.columnName) {
        row.original[col.dbColumnName] = newValue;
      }

      // Identifier update logic for TableDir/Search
      if (
        selectedOption &&
        (fieldType === FieldType.TABLEDIR ||
          fieldType === FieldType.SEARCH ||
          reference === FIELD_REFERENCE_CODES.PRODUCT ||
          reference === FIELD_REFERENCE_CODES.SELECTOR)
      ) {
        const identifierLabel = selectedOption.label || selectedOption._identifier;
        row.original[`${col.columnName}$_identifier`] = identifierLabel;
        if (col.dbColumnName && col.dbColumnName !== col.columnName) {
          row.original[`${col.dbColumnName}$_identifier`] = identifierLabel;
        }
      }

      // Notify parent of change
      if (onRecordChange) {
        onRecordChange(row, {
          [col.columnName]: newValue,
          ...(selectedOption
            ? { [`${col.columnName}$_identifier`]: selectedOption.label || selectedOption._identifier }
            : {}),
        });
      }

      cell.row._valuesCache[cell.column.id] = newValue;

      // Tell the parent that this cell has been touched so create-row
      // mandatory errors can be dismissed per cell. Use `dbColumnName` (the DB
      // column name) when present — it's the key stored in `createRowErrors`.
      // `col.columnName` here is the parsed HQL camelCase name, so falling
      // back to it preserves behavior for callers that don't supply dbColumnName.
      if (onCellEdit) {
        onCellEdit(col.dbColumnName ?? col.columnName);
      }
    },
    [
      col.columnName,
      col.dbColumnName,
      fieldType,
      reference,
      onRecordChange,
      onCellEdit,
      cell.column.id,
      cell.row._valuesCache,
      row,
    ]
  );

  const loadOptionsViaSelector = useCallback(
    async (field: any, searchQuery?: string) => {
      const selectorDefinitionId = field.selector?._selectorDefinitionId as string | undefined;
      if (!selectorDefinitionId) return [];

      const targetEntity = (field.selector?.datasourceName as string) || field.referencedEntity;
      if (!targetEntity) return [];

      // Compute the context BEFORE keying the cache: the response of
      // SelectorDefaultFilterActionHandler depends on the context, so a cache
      // keyed only by field.id risks serving a stale response built from an
      // incomplete context (e.g. the editor's first invocation on mount, when
      // the parent form's record values may not yet be populated). Fingerprinting
      // the context via `JSON.stringify` makes the cache self-invalidate when
      // the upstream values change, while still deduplicating keystroke spam
      // (between letters the context is identical → cache hit).
      const context = buildSelectorDefaultContext(effectiveRecordValuesRef.current ?? {}, tab ?? null, session);
      const cacheKey = `${field.id ?? selectorDefinitionId}|${JSON.stringify(context)}`;
      let cached = defaultsCacheRef.current.get(cacheKey);
      if (!cached) {
        cached = loadSelectorDefaults(selectorDefinitionId, context);
        defaultsCacheRef.current.set(cacheKey, cached);
      }
      const { defaults, criteria } = await cached;

      const etendoContext = tab ? buildEtendoContext(tab, graph) : {};
      const params = buildSelectorDatasourceParams({
        field,
        etendoContext,
        language,
        sorting: [],
        currentTab: tab ?? null,
        formValues: effectiveRecordValuesRef.current ?? {},
        columnFilters: [],
        defaultCriteria: criteria,
        defaultFilterResponse: defaults,
        // `gridColumns` are intentionally empty here: they're only consumed by
        // `getHiddenDefaultCriteria` inside `buildSelectorDatasourceParams`,
        // which drops criteria whose `fieldName` matches a visible column in
        // the lupa modal grid (e.g. `customer`). The lupa flow re-inserts those
        // dropped criteria via `preloadFiltersFromCriteria` → `columnFilters` →
        // `useDatasource`'s criteria stitching. The inline dropdown has no
        // such UI and skips that pipeline, so we keep ALL criteria on the wire
        // by giving `getHiddenDefaultCriteria` an empty visible-keys set.
        gridColumns: [],
      });

      if (searchQuery) {
        const existing = Array.isArray(params.criteria) ? (params.criteria as SelectorCriteria[]) : [];
        params.criteria = [...existing, { fieldName: SEARCH_FIELD_NAME, operator: "iContains", value: searchQuery }];
      }

      // Pagination + text-match params. `useDatasource → loadData` normally
      // adds these before calling `datasource.get`; since we call `datasource.get`
      // directly, we must replicate them or the backend rejects the request
      // with "Data was tried to be fetched from server without pagination".
      // Unprefixed keys (`startRow`, `endRow`, `textMatchStyle`, `noActiveFilter`)
      // are auto-prefixed with `_` by `Datasource.buildParams`.
      params.startRow = 0;
      params.endRow = PAGE_SIZE;
      params.textMatchStyle = "substring";
      params.noActiveFilter = true;

      const result = (await datasource.get(targetEntity, params)) as { data?: unknown };
      return mapResponseToOptions(result.data ?? result);
    },
    [effectiveRecordValuesRef, tab, session, graph, language]
  );

  const loadOptions = useCallback(
    async (field: any, searchQuery?: string) => {
      try {
        if (field.selector?._selectorDefinitionId) {
          return await loadOptionsViaSelector(field, searchQuery);
        }

        const fieldRef = field.column?.reference || field.reference;
        const isSelector = fieldRef === FIELD_REFERENCE_CODES.SELECTOR || fieldRef === FIELD_REFERENCE_CODES.PRODUCT;
        const selectorId = field.selector?._selectorDefinitionId;
        const datasourceName = field.selector?.datasourceName;

        const apiUrl = datasourceName
          ? `/api/datasource/${datasourceName}`
          : `/sws/com.etendorx.das.legacy.utils/datasource/${field.columnName || field.name}`;

        const payload = constructPayload(
          field,
          tabId,
          effectiveRecordValuesRef.current,
          session,
          parametersRef.current,
          isSelector,
          selectorId,
          shouldSendOrg
        );

        const data = await fetchOptionsFromDatasource(apiUrl, payload, searchQuery);
        return mapResponseToOptions(data);
      } catch (e) {
        console.error("Error loading options", e);
        return [];
      }
    },
    [tabId, session, effectiveRecordValuesRef, parametersRef, shouldSendOrg, loadOptionsViaSelector]
  );

  if (!matchingField) {
    return null;
  }

  // Generate unique IDs for accessibility
  const fieldId = `grid-cell-${row.id}-${col.columnName}`;

  // Validation state. `forceError` lets parents flag a cell as errored without
  // attaching a message (e.g. mandatory-empty cells in a create-row, where we
  // want a red border only — no text and no tooltip).
  const hasError = !!validationError || forceError === true;
  const rawErrorMessage = validationError?.message;
  const errorMessage = rawErrorMessage ? t(rawErrorMessage) : undefined;

  const isFieldReadOnly = fieldReadOnlyMap?.[col.columnName] || fieldReadOnlyMap?.[col.accessorKey] || false;

  // Magnifying-glass: identical predicate to GenericSelector.tsx (form mode).
  const hasTableRelated = matchingField.selector?.hasTableRelated === true;
  const showSearchButton = hasTableRelated && !isFieldReadOnly;

  // Mirror GenericSelector.handleSelect: resolve the real ID via `valueField`,
  // synthesize an option carrying the displayable identifier, then route the
  // selection through the same `handleChange` used by the dropdown editor —
  // that keeps `$_identifier` propagation and `onRecordChange` notification
  // unified across both paths.
  const handleModalSelect = (record: EntityData) => {
    const valueField = matchingField.selector?.valueField as string | undefined;
    const displayField = matchingField.selector?.displayField as string | undefined;
    const resolvedId = (valueField ? record[valueField] : record.id) as string | undefined;
    if (!resolvedId) return;
    const label = (displayField ? record[displayField] : record._identifier) as string | undefined;
    const option = { id: resolvedId, value: resolvedId, label: label ?? "", ...record };
    handleChange(resolvedId, option);
  };

  return (
    <div className="w-full">
      <div className="flex w-full items-center gap-1">
        <div className="flex-grow min-w-0">
          <CellEditorFactory
            fieldType={fieldType}
            value={row.original[col.columnName]}
            onChange={handleChange}
            field={{ ...matchingField, type: fieldType }}
            rowId={row.id}
            columnId={cell.column.id}
            loadOptions={loadOptions}
            disabled={isFieldReadOnly}
            hasError={hasError}
            showTooltip={false}
            onBlur={() => {}}
            id={fieldId}
            name={col.columnName}
            data-testid={`grid-cell-editor-${col.columnName}`}
          />
        </div>
        {showSearchButton && (
          <IconButton
            onClick={() => setIsSearchModalOpen(true)}
            className="w-8 h-8 flex-shrink-0"
            tooltip="Search"
            tooltipPosition="top"
            data-testid={`grid-cell-search-${col.columnName}`}>
            <SearchIcon className="w-5 h-5 fill-current" />
          </IconButton>
        )}
      </div>
      {hasError && errorMessage && <div className="text-xs text-red-500 mt-1">{errorMessage}</div>}
      {isSearchModalOpen && (
        <SelectorModal
          field={matchingField}
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSelect={handleModalSelect}
          getValues={() => effectiveRecordValuesRef.current ?? {}}
          currentTab={tab ?? null}
        />
      )}
    </div>
  );
};

/**
 * Memoized version of GridCellEditor
 * Only re-renders when cell value or row/column identity changes
 * Context values (effectiveRecordValues, parameters) are handled via refs internally
 *
 * We also compare validationError to trigger re-render on new errors
 */
export const GridCellEditor = memo(GridCellEditorBase, (prevProps, nextProps) => {
  return (
    // Important! Re-render if validation status changes
    prevProps.cell.getValue() === nextProps.cell.getValue() &&
    prevProps.row.id === nextProps.row.id &&
    prevProps.col.columnName === nextProps.col.columnName &&
    prevProps.validationError === nextProps.validationError &&
    prevProps.forceError === nextProps.forceError &&
    // Bumped by field-interactions in the parent grid; forces re-render so the
    // sibling cell re-reads `row.original` after a mutually-exclusive zeroing.
    prevProps.siblingPatchVersion === nextProps.siblingPatchVersion
  );
});

GridCellEditor.displayName = "GridCellEditor";
