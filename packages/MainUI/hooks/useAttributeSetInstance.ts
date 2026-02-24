import { useCallback, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";

interface SaveAttributeSetInstanceParams {
  attributeSetId: string;
  instanceId?: string | null;
  productId?: string;
  windowId?: string;
  locatorId?: string;
  lot?: string;
  serialNo?: string;
  expirationDate?: string;
  isLocked?: string;
  lockDescription?: string;
  customAttributes?: Record<string, string>;
}

interface SaveResult {
  id: string;
  description: string;
}

export interface UseAttributeSetInstanceResult {
  saveInstance: (params: SaveAttributeSetInstanceParams) => Promise<SaveResult>;
  loading: boolean;
  error: string | null;
  refetch?: () => void;
}

export const useAttributeSetInstance = (): UseAttributeSetInstanceResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveInstance = useCallback(async (params: SaveAttributeSetInstanceParams): Promise<SaveResult> => {
    setLoading(true);
    setError(null);

    try {
      // Build the JSON payload for the Kernel ActionHandler
      const payload = {
        _buttonValue: "DONE",
        _entityName: "AttributeSetInstance",
        _params: {
          attributeSetId: params.attributeSetId,
          instanceId: params.instanceId || "",
          productId: params.productId || "",
          windowId: params.windowId || "",
          locatorId: params.locatorId || "",
          lot: params.lot || "",
          serialNo: params.serialNo || "",
          expirationDate: params.expirationDate || "",
          isLocked: params.isLocked || "N",
          lockDescription: params.lockDescription || "",
          attributes: params.customAttributes || {},
        },
      };

      // Call the Kernel ActionHandler
      const response = await Metadata.client.request(`api/erp/org.openbravo.client.kernel?_action=com.etendoerp.metadata.AttributeSetInstanceActionHandler`, {
        method: "POST",
        body: payload,
      });

      const responseData = response?.data;

      if (responseData?.status === "Success" || responseData?.instanceId) {
        return {
          id: String(responseData.instanceId),
          description: String(responseData.description || ""),
        };
      }

      if (responseData?.status === "Error") {
        throw new Error(responseData.message || "Error saving attribute set instance");
      }

      throw new Error("Unexpected response from server");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error saving attribute set instance";
      logger.error("Error saving attribute set instance:", err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    saveInstance,
    loading,
    error,
    refetch: null as any, // Kept for compatibility if needed elsewhere
  };
};
