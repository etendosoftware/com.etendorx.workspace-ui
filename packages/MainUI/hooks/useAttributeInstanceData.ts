import { useCallback, useEffect, useState } from "react";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";

interface AttributeInstanceValue {
  attributeId: string;
  value: string;
}

interface UseAttributeInstanceDataResult {
  instanceData: {
    lot: string;
    serialNo: string;
    expirationDate: string;
    values: Record<string, string>;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAttributeInstanceData = (instanceId: string | null): UseAttributeInstanceDataResult => {
  const [instanceData, setInstanceData] = useState<UseAttributeInstanceDataResult["instanceData"]>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstanceData = useCallback(async () => {
    if (!instanceId || instanceId === "0") {
      setInstanceData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Attribute Set Instance record for core attributes (lot, serialNo, date)
      const asiResponse = (await datasource.get("AttributeSetInstance", {
        criteria: [{ fieldName: "id", operator: "equals", value: instanceId }],
      })) as any;

      const asiData = asiResponse?.data?.response?.data as EntityData[] | undefined;
      if (!asiData || asiData.length === 0) {
        setError("Attribute Set Instance not found");
        setLoading(false);
        return;
      }

      const asi = asiData[0];
      const coreData = {
        lot: String(asi.lotName || ""),
        serialNo: String(asi.serialNo || ""),
        expirationDate: String(asi.guaranteedDate || ""), // Etendo uses guaranteedDate for expiration
        values: {} as Record<string, string>,
      };

      // 2. Fetch Attribute Instance records for custom attributes
      const aiResponse = (await datasource.get("AttributeInstance", {
        criteria: [{ fieldName: "attributeSetInstance", operator: "equals", value: instanceId }],
      })) as any;

      const aiData = aiResponse?.data?.response?.data as EntityData[] | undefined;
      if (aiData) {
        aiData.forEach((item: EntityData) => {
          const attrId = String(item.attribute);
          // For list attributes, use attributeValue ID, for text use searchKey
          const value = String(item.attributeValue || item.searchKey || "");
          coreData.values[attrId] = value;
        });
      }

      setInstanceData(coreData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error fetching attribute instance data";
      logger.error("Error fetching attribute instance data:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchInstanceData();
  }, [fetchInstanceData]);

  return {
    instanceData,
    loading,
    error,
    refetch: fetchInstanceData,
  };
};
