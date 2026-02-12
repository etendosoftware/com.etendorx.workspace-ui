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

import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { buildPayloadByInputName } from "@/utils";
import { FieldName, type UseTableDirDatasourceParams } from "../types";
import useFormParent from "../useFormParent";
import { useUserContext } from "../useUserContext";
import {
  REFERENCE_IDS,
  PRODUCT_SELECTOR_DEFAULTS,
  TABLEDIR_SELECTOR_DEFAULTS,
  INVOICE_FIELD_MAPPINGS,
} from "./constants";
import { transformValueToClassicFormat } from "@/utils/datasourceUtils";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { EntityValue } from "@workspaceui/api-client/src/api/types";
const FALLBACK_RESULT: Record<string, EntityValue> = {} as Record<string, EntityValue>;

export const useTableDirDatasource = ({
  field,
  pageSize = 75,
  initialPageSize = 75,
  isProcessModal = false,
  staticOptions,
}: UseTableDirDatasourceParams) => {
  // If static options are provided, use them instead of fetching
  const hasStaticOptions = staticOptions !== undefined;

  const { getValues, watch } = useFormContext();
  const { tab, parentTab, parentRecord } = useTabContext();
  const windowId = tab?.window;
  const [records, setRecords] = useState<Record<string, string>[]>(
    hasStaticOptions ? staticOptions.map((opt) => ({ id: opt.id, _identifier: opt.name })) : []
  );
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const value = watch(field.hqlName);
  const fetchInProgressRef = useRef(false);

  const isProductField =
    field.column?.reference === REFERENCE_IDS.PRODUCT ||
    field.column?.reference === "30" ||
    field.selector?.datasourceName === "ProductStockView";

  const parentData = useFormParent(FieldName.INPUT_NAME);

  const { currentWarehouse } = useUserContext();

  const invoiceContext: Record<string, EntityValue> = useMemo(() => {
    // 1. Generic mapping using parentTab metadata (if available)
    if (parentTab?.fields && parentRecord) {
      const genericPayload = buildPayloadByInputName(parentRecord, parentTab.fields);
      return (genericPayload || FALLBACK_RESULT) as Record<string, EntityValue>;
    }

    // 2. Legacy fallback mapping for known fields
    if ((!isProductField && !parentRecord) || !tab?.fields) {
      return FALLBACK_RESULT;
    }

    const recordValues = buildPayloadByInputName(parentRecord, tab.fields);
    const context: Record<string, EntityValue> = {};

    for (const [sourceField, targetField] of Object.entries(INVOICE_FIELD_MAPPINGS)) {
      if (!recordValues) {
        return FALLBACK_RESULT;
      }
      const value = recordValues[sourceField];
      if (value !== null && value !== undefined && value !== "") {
        context[targetField] = value as EntityValue;
      }
    }

    return context;
  }, [isProductField, parentRecord, tab?.fields, parentTab?.fields]);

  const selectorId =
    field.selector?._selectorDefinitionId ||
    (isProductField ? PRODUCT_SELECTOR_DEFAULTS.FALLBACK_SELECTOR_ID : undefined);
  const transformFormValues = useCallback(
    (formData: Record<string, EntityValue>) => {
      const formValues: Record<string, EntityValue> = {};

      for (const [key, value] of Object.entries(formData)) {
        const currentField = tab?.fields?.[key];
        const inputName = currentField?.inputName || key;

        formValues[inputName] = transformValueToClassicFormat(value);
      }

      return formValues;
    },
    [tab?.fields]
  );

  interface BaseBody {
    [key: string]: unknown;
    inpfinPaymentmethodId?: string;
    inpissotrx?: string;
    windowId?: string;
    "Deposit To"?: string;
    "Sales Transaction"?: string;
  }

  const buildRequestBody = useCallback(
    (startRow: number, endRow: number, currentValue: typeof value) => {
      const transformPayloadFields = (baseBody: BaseBody): BaseBody => {
        // Remove fields that will be transformed to avoid duplicates
        const { inpfinPaymentmethodId, inpissotrx, windowId, ...rest } = baseBody;
        const depositTo = baseBody["Deposit To"];
        const salesTransaction = baseBody["Sales Transaction"];

        // Determine issotrx value from either inpissotrx or Sales Transaction
        let issotrxValue: boolean | undefined;
        if (inpissotrx !== undefined && inpissotrx !== null && inpissotrx !== "") {
          issotrxValue = inpissotrx === "Y";
        } else if (salesTransaction !== undefined && salesTransaction !== null && salesTransaction !== "") {
          issotrxValue = salesTransaction === "Y";
        }

        const result: BaseBody = {
          ...rest,
          ...(inpfinPaymentmethodId && { fin_paymentmethod_id: inpfinPaymentmethodId }),
          ...(depositTo && { fin_financial_account_id: depositTo }),
          ...(issotrxValue !== undefined && { issotrx: issotrxValue }),
        };

        return result;
      };

      const formValues = transformFormValues(getValues());
      const invoiceValue = transformFormValues(invoiceContext);
      let baseBody: BaseBody = {
        _startRow: startRow.toString(),
        _endRow: endRow.toString(),
        _operationType: "fetch",
        ...field.selector,
        moduleId: field.module,
        windowId,
        tabId: field.tab,
        inpTabId: field.tab,
        inpwindowId: windowId,
        inpTableId: field.column.table,
        initiatorField: field.hqlName,
        _constructor: "AdvancedCriteria",
        _OrExpression: "true",
        ...(typeof currentValue !== "undefined" ? { _currentValue: currentValue } : {}),
      };

      if (isProductField) {
        Object.assign(baseBody, {
          _noCount: "true",
          ...(selectorId && { _selectorDefinitionId: selectorId }),
          ...formValues,
          ...invoiceValue,
        });
      } else {
        Object.assign(baseBody, {
          _textMatchStyle: "substring",
          ...parentData,
          ...invoiceValue,
          ...formValues,
        });
      }

      // Only apply field transformation when inside process modal
      if (isProcessModal) {
        baseBody = transformPayloadFields(baseBody);
      }

      return baseBody;
    },
    [
      transformFormValues,
      getValues,
      invoiceContext,
      field.selector,
      field.module,
      field.tab,
      field.column?.table,
      field.hqlName,
      windowId,
      isProductField,
      isProcessModal,
      selectorId,
      parentData,
    ]
  );

  const buildSearchCriteria = useCallback(
    (search: string, isProduct: boolean) => {
      const dummyId = new Date().getTime();
      const baseCriteria = [
        {
          fieldName: "_dummy",
          operator: "equals",
          value: String(dummyId),
        },
      ];

      const searchFields: string[] = [];

      // 1. Prioritize Selector Configuration
      if (field.selector?.extraSearchFields) {
        searchFields.push(...field.selector.extraSearchFields.split(",").map((f) => f.trim()));
      }

      if (field.selector?.displayField && !searchFields.includes(field.selector.displayField)) {
        searchFields.push(field.selector.displayField);
      }

      // 2. Fallbacks if no fields defined in selector
      if (searchFields.length === 0) {
        if (isProduct) {
          searchFields.push(...PRODUCT_SELECTOR_DEFAULTS.SEARCH_FIELDS);
        } else {
          searchFields.push(...TABLEDIR_SELECTOR_DEFAULTS.SEARCH_FIELDS);
        }
      }

      const searchCriteria = searchFields.map((fieldName) => ({
        fieldName,
        operator: "iContains",
        value: search,
      }));

      return { dummyId, criteria: [...baseCriteria, ...searchCriteria] };
    },
    [field.selector]
  );

  const applyCriteria = useCallback(
    (body: URLSearchParams, search: string) => {
      const applySelectorCriteria = () => {
        if (!field.selector?.criteria) return;
        try {
          const existingCriteria = JSON.parse(field.selector.criteria);
          const criteriaList = Array.isArray(existingCriteria) ? existingCriteria : [existingCriteria];
          for (const c of criteriaList) {
            body.append("criteria", JSON.stringify(c));
          }
        } catch (e) {
          logger.warn("Failed to parse selector criteria", e);
        }
      };

      const applySearchCriteria = () => {
        if (!search) return;
        const { dummyId, criteria } = buildSearchCriteria(search, isProductField);

        if (isProductField) {
          body.set("criteria", JSON.stringify({ fieldName: "_dummy", operator: "equals", value: dummyId }));
          body.set("operator", "or");
        }

        for (const criterion of criteria) {
          body.append("criteria", JSON.stringify(criterion));
        }
      };

      const applyWarehouseFilter = () => {
        if (field.selector?.datasourceName !== "ProductStockView") return;
        const hasWarehouseInContext = body.has("inpmWarehouseId") || body.has("mWarehouseId") || body.has("warehouse");

        if (!hasWarehouseInContext && currentWarehouse?.id) {
          body.append(
            "criteria",
            JSON.stringify({
              fieldName: "storageBin.warehouse",
              operator: "equals",
              value: currentWarehouse.id,
            })
          );
        }
      };

      applySelectorCriteria();
      applySearchCriteria();
      applyWarehouseFilter();
    },
    [
      buildSearchCriteria,
      isProductField,
      field.selector?.criteria,
      field.selector?.datasourceName,
      currentWarehouse?.id,
    ]
  );

  const processApiResponse = useCallback(
    (data: { response?: { data?: Record<string, string>[]; metadata?: { fields?: any[] } } }, reset: boolean) => {
      if (!data?.response?.data) {
        throw new Error(JSON.stringify(data));
      }

      const responseData = data.response.data;

      const updateColumns = () => {
        if (data.response?.metadata?.fields) {
          setColumns(data.response.metadata.fields);
        }
      };

      const checkHasMore = () => {
        if (!responseData.length || responseData.length < pageSize) {
          setHasMore(false);
        }
      };

      const mergeRecords = () => {
        if (reset) {
          setRecords(responseData);
          return;
        }

        const recordMap = new Map();

        const addRecordToMap = (record: Record<string, string>) => {
          const recordId = record.id || JSON.stringify(record);
          if (!recordMap.has(recordId)) {
            recordMap.set(recordId, record);
          }
        };

        for (const record of records) {
          addRecordToMap(record);
        }

        for (const record of responseData) {
          addRecordToMap(record);
        }

        setRecords(Array.from(recordMap.values()));
      };

      updateColumns();
      checkHasMore();
      mergeRecords();

      if (!reset) {
        setCurrentPage((prev) => prev + 1);
      }
    },
    [pageSize, records]
  );

  /**
   * Handles search/filter for static options without making API calls
   */
  const handleStaticOptionsSearch = useCallback(
    (search: string) => {
      if (!staticOptions) return;

      const filteredRecords = search
        ? staticOptions.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))
        : staticOptions;

      setRecords(filteredRecords.map((opt) => ({ id: opt.id, _identifier: opt.name })));
    },
    [staticOptions]
  );

  const fetch = useCallback(
    async (_currentValue: typeof value, reset = false, search = "") => {
      // Handle static options separately (no API call needed)
      if (hasStaticOptions) {
        handleStaticOptionsSearch(search);
        return;
      }

      if (!field || fetchInProgressRef.current) {
        return;
      }

      fetchInProgressRef.current = true;
      setLoading(true);

      if (reset) {
        setCurrentPage(0);
        setHasMore(true);
      }

      try {
        const startRow = reset ? 0 : currentPage * pageSize;
        const endRow = reset ? initialPageSize : startRow + pageSize;

        const baseBody = buildRequestBody(startRow, endRow, _currentValue);
        const body = new URLSearchParams(baseBody as Record<string, string>);

        applyCriteria(body, search);

        const { data } = await datasource.client.request(`/api/datasource/${field.selector?.datasourceName ?? ""}`, {
          method: "POST",
          body,
        });

        processApiResponse(data, reset);
      } catch (err) {
        logger.warn(err);
        if (reset) {
          setRecords([]);
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [
      field,
      currentPage,
      pageSize,
      initialPageSize,
      buildRequestBody,
      applyCriteria,
      processApiResponse,
      hasStaticOptions,
      handleStaticOptionsSearch,
    ]
  );

  const search = useCallback(
    (term: string) => {
      setSearchTerm(term);
      fetch(value, true, term);
    },
    [fetch, value]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetch(value, false, searchTerm);
    }
  }, [fetch, loading, hasMore, value, searchTerm]);

  const refetch = useCallback(
    (reset = true) => {
      fetch(value, reset, searchTerm);
    },
    [fetch, value, searchTerm]
  );

  return {
    records,
    loading,
    error,
    refetch,
    loadMore,
    hasMore,
    search,
    searchTerm,
    columns,
  };
};
