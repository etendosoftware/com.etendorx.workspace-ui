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
import { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { buildPayloadByInputName } from "@/utils";
import { FieldName, type UseTableDirDatasourceParams } from "../types";
import useFormParent from "../useFormParent";
import {
  REFERENCE_IDS,
  PRODUCT_SELECTOR_DEFAULTS,
  TABLEDIR_SELECTOR_DEFAULTS,
  INVOICE_FIELD_MAPPINGS,
  FORM_VALUE_MAPPINGS,
} from "./constants";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { EntityValue } from "@workspaceui/api-client/src/api/types";
const FALLBACK_RESULT: Record<string, EntityValue> = {} as Record<string, EntityValue>;

export const useTableDirDatasource = ({ field, pageSize = 75, initialPageSize = 75 }: UseTableDirDatasourceParams) => {
  const { getValues, watch } = useFormContext();
  const { tab, parentRecord } = useTabContext();
  const windowId = tab.window;
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const value = watch(field.hqlName);

  const isProductField = field.column.reference === REFERENCE_IDS.PRODUCT;
  const parentData = useFormParent(FieldName.INPUT_NAME);

  const invoiceContext: Record<string, EntityValue> = useMemo(() => {
    if (!isProductField && !parentRecord && !tab?.fields) {
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
  }, [isProductField, parentRecord, tab?.fields]);

  const selectorId =
    field.selector?._selectorDefinitionId ||
    (isProductField ? PRODUCT_SELECTOR_DEFAULTS.FALLBACK_SELECTOR_ID : undefined);
  const transformFormValues = useCallback(
    (formData: Record<string, EntityValue>) => {
      const formValues: Record<string, EntityValue> = {};

      for (const [key, value] of Object.entries(formData)) {
        const currentField = tab.fields[key];
        const inputName = currentField?.inputName || key;
        const stringValue = String(value);

        const isISODate = /^\d{4}-\d{2}-\d{2}$/.test(stringValue);

        const formattedValue = isISODate ? stringValue.split("-").reverse().join("-") : stringValue;

        const safeValue = Object.prototype.hasOwnProperty.call(FORM_VALUE_MAPPINGS, formattedValue)
          ? FORM_VALUE_MAPPINGS[formattedValue as keyof typeof FORM_VALUE_MAPPINGS]
          : formattedValue;

        formValues[inputName] = safeValue;
      }

      return formValues;
    },
    [tab.fields]
  );

  const buildRequestBody = useCallback(
    (startRow: number, endRow: number, currentValue: typeof value) => {
      interface BaseBody {
        [key: string]: unknown;
        inpfinPaymentmethodId?: string;
        inpissotrx?: string;
        windowId?: string;
        "Deposit To"?: string;
        "Sales Transaction"?: string;
      }

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
      baseBody = transformPayloadFields(baseBody);

      return baseBody;
    },
    [field, windowId, selectorId, isProductField, parentData, invoiceContext, transformFormValues, getValues]
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

      if (isProduct) {
        const productCriteria = PRODUCT_SELECTOR_DEFAULTS.SEARCH_FIELDS.map((fieldName) => ({
          fieldName,
          operator: "iContains",
          value: search,
        }));
        return { dummyId, criteria: [...baseCriteria, ...productCriteria] };
      }
      const searchFields = [];
      if (field.selector?.displayField) {
        searchFields.push(field.selector.displayField);
      }
      if (field.selector?.extraSearchFields) {
        searchFields.push(...field.selector.extraSearchFields.split(",").map((f) => f.trim()));
      }
      if (searchFields.length === 0) {
        searchFields.push(...TABLEDIR_SELECTOR_DEFAULTS.SEARCH_FIELDS);
      }

      const tableDirCriteria = searchFields.map((fieldName) => ({
        fieldName,
        operator: "iContains",
        value: search,
      }));

      return { dummyId, criteria: [...baseCriteria, ...tableDirCriteria] };
    },
    [field.selector]
  );

  const applySearchCriteria = useCallback(
    (body: URLSearchParams, search: string) => {
      const { dummyId, criteria } = buildSearchCriteria(search, isProductField);

      if (isProductField) {
        body.set("criteria", JSON.stringify({ fieldName: "_dummy", operator: "equals", value: dummyId }));
        body.set("operator", "or");
      }

      for (const criterion of criteria) {
        body.append("criteria", JSON.stringify(criterion));
      }
    },
    [buildSearchCriteria, isProductField]
  );

  const processApiResponse = useCallback(
    (data: { response?: { data?: Record<string, string>[] } }, reset: boolean) => {
      if (!data?.response?.data) {
        throw new Error(JSON.stringify(data));
      }

      const responseData = data.response.data;

      if (!responseData.length || responseData.length < pageSize) {
        setHasMore(false);
      }

      if (reset) {
        setRecords(responseData);
      } else {
        const recordMap = new Map();

        for (const record of records) {
          const recordId = record.id || JSON.stringify(record);
          if (!recordMap.has(recordId)) {
            recordMap.set(recordId, record);
          }
        }

        for (const record of responseData) {
          const recordId = record.id || JSON.stringify(record);
          if (!recordMap.has(recordId)) {
            recordMap.set(recordId, record);
          }
        }

        setRecords(Array.from(recordMap.values()));
      }

      if (!reset) {
        setCurrentPage((prev) => prev + 1);
      }
    },
    [pageSize, records]
  );

  const fetch = useCallback(
    async (_currentValue: typeof value, reset = false, search = "") => {
      try {
        if (!field || !tab) return;

        setLoading(true);

        if (reset) {
          setCurrentPage(0);
          setHasMore(true);
        }

        const startRow = reset ? 0 : currentPage * pageSize;
        const endRow = reset ? initialPageSize : startRow + pageSize;

        const baseBody = buildRequestBody(startRow, endRow, _currentValue);
        const body = new URLSearchParams(baseBody as Record<string, string>);

        if (search) {
          applySearchCriteria(body, search);
        }

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
      }
    },
    [field, tab, currentPage, pageSize, initialPageSize, buildRequestBody, applySearchCriteria, processApiResponse]
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
  };
};
