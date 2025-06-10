import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FALLBACK_RESULT } from "@/components/ProcessModal/ProcessDefinitionModal";
import type { RecordValues } from "@/components/ProcessModal/types";
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

export const useTableDirDatasource = ({ field, pageSize = 20, initialPageSize = 20 }: UseTableDirDatasourceParams) => {
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

  const recordValues: RecordValues = useMemo(() => {
    if (!isProductField || !parentRecord || !tab?.fields) return FALLBACK_RESULT;
    return buildPayloadByInputName(parentRecord, tab.fields);
  }, [isProductField, parentRecord, tab?.fields]);

  const invoiceContext: Record<string, EntityValue> = useMemo(() => {
    if (!isProductField) return {};

    const context: Record<string, EntityValue> = {};
    for (const [sourceField, targetField] of Object.entries(INVOICE_FIELD_MAPPINGS)) {
      const value = recordValues[sourceField];
      if (value !== null && value !== undefined && value !== "") {
        context[targetField] = value;
      }
    }
    return context;
  }, [isProductField, recordValues]);

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

        const safeValue = Object.prototype.hasOwnProperty.call(FORM_VALUE_MAPPINGS, stringValue)
          ? FORM_VALUE_MAPPINGS[stringValue as keyof typeof FORM_VALUE_MAPPINGS]
          : value;

        formValues[inputName] = safeValue;
      }

      return formValues;
    },
    [tab.fields]
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
        searchFields.push(...field.selector.extraSearchFields.split(",").map((f: string) => f.trim()));
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
        const formValues = transformFormValues(getValues());

        // Construir body base
        const baseBody = {
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
          ...(typeof _currentValue !== "undefined" ? { _currentValue } : {}),
        };

        // Aplicar configuraciones específicas por tipo
        if (isProductField) {
          Object.assign(baseBody, {
            _noCount: "true",
            ...(selectorId && { _selectorDefinitionId: selectorId }),
            ...invoiceContext,
            ...formValues,
          });
        } else {
          Object.assign(baseBody, {
            _textMatchStyle: "substring",
            ...parentData,
            ...formValues,
          });
        }

        const body = new URLSearchParams(baseBody);

        // Manejar criterios de búsqueda
        if (search) {
          const { dummyId, criteria } = buildSearchCriteria(search, isProductField);

          if (isProductField) {
            body.set("criteria", JSON.stringify({ fieldName: "_dummy", operator: "equals", value: dummyId }));
            body.set("operator", "or");
          }

          for (const criterion of criteria) {
            body.append("criteria", JSON.stringify(criterion));
          }
        }

        const { data } = await datasource.client.request(field.selector?.datasourceName ?? "", {
          method: "POST",
          body,
        });

        if (data?.response?.data) {
          if (!data.response.data.length || data.response.data.length < pageSize) {
            setHasMore(false);
          }

          if (reset) {
            setRecords(data.response.data);
          } else {
            const recordMap = new Map();

            // Agregar registros existentes
            for (const record of records) {
              const recordId = record.id || JSON.stringify(record);
              recordMap.set(recordId, record);
            }

            // Agregar nuevos registros
            for (const record of data.response.data) {
              const recordId = record.id || JSON.stringify(record);
              recordMap.set(recordId, record);
            }

            setRecords(Array.from(recordMap.values()));
          }

          if (!reset) {
            setCurrentPage((prev) => prev + 1);
          }
        } else {
          throw new Error(data);
        }
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
    [
      field,
      tab,
      currentPage,
      pageSize,
      initialPageSize,
      selectorId,
      windowId,
      isProductField,
      invoiceContext,
      parentData,
      transformFormValues,
      buildSearchCriteria,
      getValues,
      records,
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
  };
};
