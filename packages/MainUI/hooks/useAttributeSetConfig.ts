import { useCallback, useEffect, useState } from "react";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { logger } from "@/utils/logger";
import type {
  AttributeSetConfig,
  CustomAttribute,
  AttributeValueOption,
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
      // Fetch the AttributeSet record
      const attrSetResponse = await datasource.get("AttributeSet", {
        criteria: [{ fieldName: "id", operator: "equals", value: attributeSetId }],
      });

      const attrSetData = attrSetResponse?.data?.response?.data as EntityData[] | undefined;
      if (!attrSetData || attrSetData.length === 0) {
        setError("Attribute Set not found");
        setLoading(false);
        return;
      }

      const attrSet = attrSetData[0];
      setConfig({
        id: String(attrSet.id),
        isLot: attrSet.lot === true,
        isSerNo: attrSet.serialNo === true,
        isExpirationDate: attrSet.expirationDate === true,
        isGuaranteeDate: attrSet.guaranteeDate === true,
        description: String(attrSet._identifier || attrSet.name || ""),
      });

      // Fetch AttributeUse records to get custom attributes
      const attrUseResponse = await datasource.get("AttributeUse", {
        criteria: [{ fieldName: "attributeSet", operator: "equals", value: attributeSetId }],
        sortBy: "sequenceNumber",
      });

      const attrUseData = attrUseResponse?.data?.response?.data as EntityData[] | undefined;
      if (!attrUseData || attrUseData.length === 0) {
        setCustomAttributes([]);
        setLoading(false);
        return;
      }

      // Build custom attributes with their values
      const attributes: CustomAttribute[] = [];

      for (const attrUse of attrUseData) {
        const attributeId = String(attrUse.attribute);
        const isList = attrUse.attribute$isList === true;

        let values: AttributeValueOption[] = [];

        if (isList) {
          // Fetch AttributeValue records for list-based attributes
          const attrValResponse = await datasource.get("AttributeValue", {
            criteria: [{ fieldName: "attribute", operator: "equals", value: attributeId }],
            sortBy: "name",
          });

          const attrValData = attrValResponse?.data?.response?.data as EntityData[] | undefined;
          if (attrValData) {
            values = attrValData.map((val: EntityData) => ({
              id: String(val.id),
              name: String(val._identifier || val.name || ""),
            }));
          }
        }

        attributes.push({
          id: attributeId,
          name: String(attrUse.attribute$_identifier || ""),
          isList,
          isMandatory: attrUse.attribute$isMandatory === true,
          sequenceNumber: Number(attrUse.sequenceNumber || 0),
          values,
        });
      }

      setCustomAttributes(attributes);
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
