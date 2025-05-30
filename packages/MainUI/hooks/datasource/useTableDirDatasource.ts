import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import { datasource } from "@workspaceui/etendohookbinder/src/api/datasource";
import type { Field, Tab } from "@workspaceui/etendohookbinder/src/api/types";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FieldName } from "../types";
import useFormParent from "../useFormParent";

export interface UseTableDirDatasourceParams {
  field: Field;
  tab?: Tab;
  pageSize?: number;
  initialPageSize?: number;
}

export const useTableDirDatasource = ({ field, pageSize = 20, initialPageSize = 20 }: UseTableDirDatasourceParams) => {
  const { getValues, watch } = useFormContext();
  const { tab } = useTabContext();
  const windowId = tab.window;
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const parentData = useFormParent(FieldName.INPUT_NAME);
  const [error, setError] = useState<Error>();
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const value = watch(field.hqlName);

  const fetch = useCallback(
    async (_currentValue: typeof value, reset = false, search = "") => {
      try {
        if (!field || !tab) {
          return;
        }

        setLoading(true);

        if (reset) {
          setCurrentPage(0);
          setHasMore(true);
        }

        const startRow = reset ? 0 : currentPage * pageSize;
        const endRow = reset ? initialPageSize : startRow + pageSize;

        const body = new URLSearchParams({
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
          _textMatchStyle: "substring",
          ...(typeof _currentValue !== "undefined" ? { _currentValue } : {}),
          ...parentData,
        });

        if (search) {
          const dummyId = new Date().getTime();

          body.append(
            "criteria",
            JSON.stringify({
              fieldName: "_dummy",
              operator: "equals",
              value: dummyId,
            }),
          );

          const searchFields = [];
          if (field.selector?.displayField) {
            searchFields.push(field.selector.displayField);
          }
          if (field.selector?.extraSearchFields) {
            searchFields.push(...field.selector.extraSearchFields.split(",").map((f) => f.trim()));
          }
          if (searchFields.length === 0) {
            searchFields.push("name", "value", "description");
          }
          for (const fieldName of searchFields) {
            body.append(
              "criteria",
              JSON.stringify({
                fieldName,
                operator: "iContains",
                value: search,
              }),
            );
          }
        }

        for (const [key, value] of Object.entries(getValues())) {
          const currentField = tab.fields[key];
          const _key = currentField?.inputName || key;
          const stringValue = String(value);

          const valueMap = {
            true: "Y",
            false: "N",
            null: "null",
          };

          const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
            ? valueMap[stringValue as keyof typeof valueMap]
            : value;

          body.set(_key, safeValue);
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

            for (const record of records) {
              const recordId = record.id || JSON.stringify(record);
              recordMap.set(recordId, record);
            }

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
    [field, tab, currentPage, pageSize, initialPageSize, windowId, parentData, getValues, records],
  );

  const search = useCallback(
    (term: string) => {
      setSearchTerm(term);
      fetch(value, true, term);
    },
    [fetch, value],
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
    [fetch, value, searchTerm],
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
