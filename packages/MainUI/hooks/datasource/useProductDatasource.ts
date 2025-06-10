import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import { datasource } from "@workspaceui/etendohookbinder/src/api/datasource";
import type { EntityValue, Field, Tab } from "@workspaceui/etendohookbinder/src/api/types";
import { useCallback, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FALLBACK_RESULT } from "@/components/ProcessModal/ProcessDefinitionModal";
import type { RecordValues } from "@/components/ProcessModal/types";
import { buildPayloadByInputName } from "@/utils";

export interface UseProductDatasourceParams {
  field: Field;
  tab?: Tab;
  pageSize?: number;
  initialPageSize?: number;
}

const INVOICE_FIELD_MAPPINGS: Record<string, string> = {
  priceList: "inpmPricelistId",
  currency: "inpcCurrencyId",
  businessPartner: "inpcBpartnerId",
  invoiceDate: "inpdateinvoiced",
  documentType: "inpcDoctypeId",
  transactionDocument: "inpcDoctypetargetId",
  paymentTerms: "inpcPaymenttermId",
  salesRepresentative: "inpsalesrepId",
  partnerAddress: "inpcBpartnerLocationId",
  paymentMethod: "inpfinPaymentmethodId",
  project: "inpcProjectId",
  costcenter: "inpcCostcenterId",
  salesCampaign: "inpcCampaignId",
  activity: "inpcActivityId",
  asset: "inpaAssetId",
  withholding: "inpwithholding",
  orderReference: "inporderReference",
  salesOrder: "inpcOrderId",
  stDimension: "inpuser1Id",
  ndDimension: "inpuser2Id",
} as const;

export const useProductDatasource = ({ field, pageSize = 20, initialPageSize = 20 }: UseProductDatasourceParams) => {
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

  const recordValues: RecordValues = useMemo(() => {
    if (!parentRecord || !tab?.fields) return FALLBACK_RESULT;
    return buildPayloadByInputName(parentRecord, tab.fields);
  }, [parentRecord, tab?.fields]);

  const invoiceContext: Record<string, EntityValue> = useMemo(() => {
    const context: Record<string, EntityValue> = {};

    for (const sourceField in INVOICE_FIELD_MAPPINGS) {
      const targetField = INVOICE_FIELD_MAPPINGS[sourceField];
      const value = recordValues[sourceField];
      if (value !== null && value !== undefined && value !== "") {
        context[targetField] = value;
      }
    }

    return context;
  }, [recordValues]);

  const selectorId = field.selector?._selectorDefinitionId || "EB3C41F0973A4EDA91E475833792A6D4";

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

        const formValues: Record<string, Field> = {};
        const formData = getValues();
        for (const key in formData) {
          const value = formData[key];
          const currentField = tab.fields[key];
          const inputName = currentField?.inputName || key;
          const stringValue = String(value);

          const valueMap = {
            true: "Y",
            false: "N",
            null: "null",
          };

          const safeValue = Object.prototype.hasOwnProperty.call(valueMap, stringValue)
            ? valueMap[stringValue as keyof typeof valueMap]
            : value;

          formValues[inputName] = safeValue;
        }

        const dummyId = new Date().getTime();
        const criteria = [
          {
            fieldName: "_dummy",
            operator: "equals",
            value: String(dummyId),
          },
        ];

        if (search) {
          const searchFields = ["productName", "searchKey"];
          for (let i = 0; i < searchFields.length; i++) {
            criteria.push({
              fieldName: searchFields[i],
              operator: "iContains",
              value: search,
            });
          }
        }

        const body = new URLSearchParams({
          _startRow: startRow.toString(),
          _endRow: endRow.toString(),
          _operationType: "fetch",
          _textMatchStyle: "substring",
          _noCount: "true",
          _sortBy: "productName",
          _selectedProperties:
            "id,productName,chDescription,standardPrice,netListPrice,searchKey,priceLimit,uOM,productName,priceListVersion,genericProduct,currency,salesPriceList,priceListVersionName",
          _extraProperties: "id,productName,uOM,currency,standardPrice,netListPrice,priceLimit,",
          _selectorDefinitionId: selectorId,
          filterClass: "org.openbravo.userinterface.selector.SelectorDataSourceFilter",
          ...(field.selector || {}),
          moduleId: field.module,
          windowId,
          tabId: field.tab,
          inpTabId: field.tab,
          inpwindowId: windowId,
          inpTableId: field.column.table,
          initiatorField: field.hqlName,
          _constructor: "AdvancedCriteria",
          _OrExpression: "true",
          operator: "or",
          criteria: JSON.stringify({ fieldName: "_dummy", operator: "equals", value: dummyId }),
          ...(typeof _currentValue !== "undefined" ? { _currentValue } : {}),
          ...invoiceContext,
          ...formValues,
        });

        for (let i = 0; i < criteria.length; i++) {
          body.append("criteria", JSON.stringify(criteria[i]));
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

            for (let i = 0; i < records.length; i++) {
              const record = records[i];
              const recordId = record.id || JSON.stringify(record);
              recordMap.set(recordId, record);
            }

            for (let i = 0; i < data.response.data.length; i++) {
              const record = data.response.data[i];
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
    [field, tab, currentPage, pageSize, initialPageSize, selectorId, windowId, invoiceContext, getValues, records]
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
