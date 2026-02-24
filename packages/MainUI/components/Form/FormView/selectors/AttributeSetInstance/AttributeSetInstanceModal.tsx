import type React from "react";
import { useState, useCallback, useEffect, useMemo } from "react";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import Button from "@mui/material/Button";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import { TextInput } from "../components/TextInput";
import { DateInput } from "../components/DateInput";
import { useAttributeSetConfig } from "@/hooks/useAttributeSetConfig";
import { useAttributeSetInstance } from "@/hooks/useAttributeSetInstance";
import { useAttributeInstanceData } from "@/hooks/useAttributeInstanceData";
import { logger } from "@/utils/logger";
import type { Field } from "@workspaceui/api-client/src/api/types";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import type { AttributeSetInstanceFormData, CustomAttribute } from "./types";

interface AttributeSetInstanceModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (data: { id: string; description: string }) => void;
  attributeSetId: string | null;
  currentInstanceId?: string | null;
  productId?: string | null;
  windowId?: string;
  field: Field;
}

const INITIAL_FORM_DATA: AttributeSetInstanceFormData = {
  lot: "",
  serialNo: "",
  expirationDate: "",
  guaranteeDate: "",
  description: "",
  customAttributes: {},
};

const buildDescription = (formData: AttributeSetInstanceFormData, customAttributes: CustomAttribute[]): string => {
  const parts: string[] = [];

  if (formData.lot) parts.push(formData.lot);
  if (formData.serialNo) parts.push(`#${formData.serialNo}`);

  for (const attr of customAttributes) {
    const value = formData.customAttributes[attr.id];
    if (value) {
      if (attr.isList) {
        const selectedOption = attr.values.find((v) => v.id === value);
        if (selectedOption) parts.push(selectedOption.name);
      } else {
        parts.push(value);
      }
    }
  }

  if (formData.expirationDate) parts.push(formData.expirationDate);
  if (formData.guaranteeDate) parts.push(formData.guaranteeDate);

  return parts.join("_");
};

const AttributeSetInstanceModal: React.FC<AttributeSetInstanceModalProps> = ({
  open,
  onCancel,
  onSave,
  attributeSetId,
  currentInstanceId,
  productId,
  windowId,
  field,
}) => {
  const {
    config,
    customAttributes,
    loading: configLoading,
    error: configError,
  } = useAttributeSetConfig(open ? attributeSetId : null);

  const {
    instanceData,
    loading: dataLoading,
    error: dataError,
  } = useAttributeInstanceData(open ? currentInstanceId : null);

  const { saveInstance, loading: saving, error: saveHookError } = useAttributeSetInstance();

  const [formData, setFormData] = useState<AttributeSetInstanceFormData>(INITIAL_FORM_DATA);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing instance data when editing
  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_DATA);
      setSaveError(null);
      return;
    }

    if (instanceData) {
      setFormData({
        lot: instanceData.lot,
        serialNo: instanceData.serialNo,
        expirationDate: instanceData.expirationDate,
        guaranteeDate: "", // Map appropriately if needed
        description: "", // Usually generated
        customAttributes: { ...instanceData.values },
      });
    }
  }, [open, instanceData]);

  const handleInputChange = useCallback(
    (fieldName: keyof Omit<AttributeSetInstanceFormData, "customAttributes">, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    },
    []
  );

  const handleCustomAttributeChange = useCallback((attributeId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customAttributes: {
        ...prev.customAttributes,
        [attributeId]: value,
      },
    }));
  }, []);

  const handleDateChange = useCallback(
    (fieldName: "expirationDate" | "guaranteeDate", e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: e.target.value,
      }));
    },
    []
  );

  const hasRequiredFields = useMemo(() => {
    if (!config) return false;
    for (const attr of customAttributes) {
      if (attr.isMandatory && !formData.customAttributes[attr.id]) {
        return false;
      }
    }
    return true;
  }, [config, customAttributes, formData]);

  const handleSave = useCallback(async () => {
    if (!config || saving || !attributeSetId) return;

    setSaveError(null);

    try {
      const description = formData.description || buildDescription(formData, customAttributes);

      const result = await saveInstance({
        attributeSetId,
        instanceId: currentInstanceId,
        productId: productId || undefined,
        windowId: windowId || undefined,
        lot: formData.lot || undefined,
        serialNo: formData.serialNo || undefined,
        expirationDate: formData.expirationDate || undefined,
        guaranteeDate: formData.guaranteeDate || undefined,
        description,
        customAttributes:
          Object.keys(formData.customAttributes).length > 0 ? formData.customAttributes : undefined,
      });

      onSave(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error saving attribute set instance";
      setSaveError(errorMessage);
    }
  }, [config, saving, attributeSetId, formData, customAttributes, currentInstanceId, productId, windowId, saveInstance, onSave]);

  const renderStandardFields = () => {
    if (!config) return null;

    return (
      <>
        {config.isLot && (
          <TextInput
            label="Lot Name"
            field={{ ...field, isMandatory: false, name: "lot", hqlName: "lot" }}
            value={formData.lot}
            onChange={(e) => handleInputChange("lot", e.target.value)}
            className="w-full"
          />
        )}

        {config.isSerNo && (
          <TextInput
            label="Serial Number"
            field={{ ...field, isMandatory: false, name: "serialNo", hqlName: "serialNo" }}
            value={formData.serialNo}
            onChange={(e) => handleInputChange("serialNo", e.target.value)}
            className="w-full"
          />
        )}

        {config.isExpirationDate && (
          <div className="w-full font-['Inter'] font-medium">
            <DateInput
              label="Expiration Date"
              field={{ ...field, isMandatory: false, name: "expirationDate", hqlName: "expirationDate" }}
              value={formData.expirationDate}
              onChange={(e) => handleDateChange("expirationDate", e)}
            />
          </div>
        )}

        {config.isGuaranteeDate && (
          <div className="w-full font-['Inter'] font-medium">
            <DateInput
              label="Guarantee Date"
              field={{ ...field, isMandatory: false, name: "guaranteeDate", hqlName: "guaranteeDate" }}
              value={formData.guaranteeDate}
              onChange={(e) => handleDateChange("guaranteeDate", e)}
            />
          </div>
        )}

        <TextInput
          label="Description"
          field={{ ...field, isMandatory: false, name: "description", hqlName: "description" }}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className="w-full"
        />
      </>
    );
  };

  const renderCustomAttributes = () => {
    if (customAttributes.length === 0) return null;

    return customAttributes.map((attr) => {
      if (attr.isList) {
        const options: Option[] = attr.values.map((v) => ({
          id: v.id,
          title: v.name,
          value: v.id,
        }));

        const selectedValue = formData.customAttributes[attr.id] || "";
        const selectedOption = options.find((o) => o.value === selectedValue) || null;

        return (
          <div key={attr.id}>
            <label htmlFor={`custom-attr-${attr.id}`} className="block text-sm font-medium text-gray-700 mb-1">
              {attr.name}
              {attr.isMandatory && <span className="text-error-main ml-1">*</span>}
            </label>
            <Select
              options={options}
              value={selectedOption}
              onChange={(_event, newValue) => {
                handleCustomAttributeChange(attr.id, newValue?.value || "");
              }}
              id={`custom-attr-${attr.id}`}
              disabled={saving}
            />
          </div>
        );
      }

      return (
        <TextInput
          key={attr.id}
          label={attr.name}
          field={{ ...field, isMandatory: attr.isMandatory, name: attr.id, hqlName: attr.id }}
          value={formData.customAttributes[attr.id] || ""}
          onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
          className="w-full"
        />
      );
    });
  };

  const combinedError = configError || saveError || saveHookError;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      tittleHeader="Attribute Selector"
      descriptionText="Attribute"
      HeaderIcon={SearchOutlined}
      showHeader
      buttons={
        <div className="flex gap-2">
          <Button variant="outlined" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!hasRequiredFields || saving || configLoading || !config}>
            {saving ? (
              <div className="flex items-center gap-2">
                <Spinner />
                <span>Saving...</span>
              </div>
            ) : (
              "OK"
            )}
          </Button>
        </div>
      }>
      <div className="space-y-4 p-4">
        {combinedError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{String(combinedError)}</p>
          </div>
        )}

        {configLoading && (
          <div className="flex items-center justify-center p-8">
            <Spinner />
          </div>
        )}

        {!configLoading && !attributeSetId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-600">
              No Attribute Set is configured for this product. Please select a product with an Attribute Set first.
            </p>
          </div>
        )}

        {!configLoading && config && (
          <>
            {renderStandardFields()}
            {renderCustomAttributes()}
          </>
        )}
      </div>
    </Modal>
  );
};

export default AttributeSetInstanceModal;
