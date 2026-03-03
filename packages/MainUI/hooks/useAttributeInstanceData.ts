import { useCallback, useEffect, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";

interface UseAttributeInstanceDataResult {
  instanceData: {
    lot: string;
    serialNo: string;
    expirationDate: string;
    guaranteeDate: string;
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
      // Use the Kernel ActionHandler with FETCH action to bypass entity access restrictions
      const response = await Metadata.client.request(
        "api/erp/org.openbravo.client.kernel?_action=com.etendoerp.metadata.AttributeSetInstanceActionHandler",
        {
          method: "POST",
          body: {
            _buttonValue: "FETCH",
            _entityName: "AttributeSetInstance",
            _params: {
              instanceId,
            },
          },
        }
      );

      const data = response?.data;

      if (!data || data.status === "Error") {
        const msg = data?.message || "Attribute Set Instance not found";
        logger.warn(`Failed to fetch ASI ${instanceId}: ${msg}`);
        setError(msg);
        setLoading(false);
        return;
      }

      const expirationDate = String(data.expirationDate || "");
      const guaranteeDate = String(data.guaranteeDate || "");

      const coreData = {
        lot: String(data.lotName || ""),
        serialNo: String(data.serialNo || ""),
        expirationDate,
        guaranteeDate: guaranteeDate || expirationDate,
        values: {} as Record<string, string>,
      };

      // Parse custom attribute values from the response
      if (data.customAttributes) {
        const customAttrs = data.customAttributes;
        for (const attrId of Object.keys(customAttrs)) {
          coreData.values[attrId] = String(customAttrs[attrId] || "");
        }
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
