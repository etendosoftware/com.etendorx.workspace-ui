import { useCallback, useEffect, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import type {
  AttributeSetConfig,
  CustomAttribute,
} from "@/components/Form/FormView/selectors/AttributeSetInstance/types";

interface UseAttributeSetConfigResult {
  config: AttributeSetConfig | null;
  customAttributes: CustomAttribute[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAttributeSetConfig = (attributeSetId: string | null): UseAttributeSetConfigResult => {
  const [config, setConfig] = useState<AttributeSetConfig | null>(null);
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!attributeSetId) {
      setConfig(null);
      setCustomAttributes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the Kernel ActionHandler with CONFIG action to bypass datasource restrictions
      const response = await Metadata.client.request(
        "api/erp/org.openbravo.client.kernel?_action=com.etendoerp.metadata.AttributeSetInstanceActionHandler",
        {
          method: "POST",
          body: {
            _buttonValue: "CONFIG",
            _entityName: "AttributeSetInstance",
            _params: {
              attributeSetId,
            },
          },
        }
      );

      const data = response?.data;

      if (!data || data.status === "Error") {
        const msg = data?.message || "Attribute Set not found";
        logger.warn(`Failed to fetch config for ${attributeSetId}: ${msg}`);
        setError(msg);
        setLoading(false);
        return;
      }

      setConfig({
        id: String(data.id),
        isLot: data.isLot === true,
        isSerNo: data.isSerNo === true,
        isExpirationDate: data.isExpirationDate === true,
        isGuaranteeDate: data.isGuaranteeDate === true,
        description: String(data.name || ""),
      });

      // Parse custom attributes from the response
      const attrs: CustomAttribute[] = [];
      const rawAttrs = data.customAttributes;

      if (Array.isArray(rawAttrs)) {
        for (const attr of rawAttrs) {
          const values = Array.isArray(attr.values)
            ? attr.values.map((v: { id: string; name: string }) => ({
                id: String(v.id),
                name: String(v.name || ""),
              }))
            : [];

          attrs.push({
            id: String(attr.id),
            name: String(attr.name || ""),
            isList: attr.isList === true,
            isMandatory: attr.isMandatory === true,
            sequenceNumber: Number(attr.sequenceNumber || 0),
            values,
          });
        }
      }

      setCustomAttributes(attrs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error fetching attribute set config";
      logger.error("Error fetching attribute set config:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [attributeSetId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    customAttributes,
    loading,
    error,
    refetch: fetchConfig,
  };
};
