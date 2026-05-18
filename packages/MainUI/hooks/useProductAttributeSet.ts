import { useCallback, useEffect, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";

interface UseProductAttributeSetResult {
  attributeSetId: string | null;
  loading: boolean;
}

export const useProductAttributeSet = (productId: string | null): UseProductAttributeSetResult => {
  const [attributeSetId, setAttributeSetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAttributeSet = useCallback(async () => {
    if (!productId) {
      setAttributeSetId(null);
      return;
    }

    setLoading(true);
    try {
      const response = await Metadata.client.request(
        "api/erp/org.openbravo.client.kernel?_action=com.etendoerp.metadata.AttributeSetInstanceActionHandler",
        {
          method: "POST",
          body: {
            _buttonValue: "PRODUCT",
            _entityName: "AttributeSetInstance",
            _params: { productId },
          },
        }
      );

      const data = response?.data;
      if (data?.status === "Success" && data?.attributeSetId) {
        setAttributeSetId(String(data.attributeSetId));
      } else {
        setAttributeSetId(null);
      }
    } catch (err) {
      logger.warn("Could not fetch attribute set for product:", err);
      setAttributeSetId(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchAttributeSet();
  }, [fetchAttributeSet]);

  return { attributeSetId, loading };
};
