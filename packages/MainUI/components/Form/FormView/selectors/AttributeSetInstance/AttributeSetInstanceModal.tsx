import type React from "react";
import { useState, useCallback, useEffect, useMemo } from "react";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
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

const formatDateToDMY = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-");
  if (y.length === 4) return `${d}-${m}-${y}`;
  return dateStr;
};

const resolveAttributeLabel = (
  attr: CustomAttribute,
  value: string,
  customAttributes: Record<string, string>
): string => {
  if (!attr.isList) return value;
  const selectedOption = attr.values.find((v) => v.id === value);
  if (selectedOption) return selectedOption.name;
  return customAttributes[`${attr.id}_identifier`] || value;
};

const buildDescription = (formData: AttributeSetInstanceFormData, customAttributes: CustomAttribute[]): string => {
  const parts: string[] = [];

  for (const attr of customAttributes) {
    const value = formData.customAttributes[attr.id];
    if (value) {
      parts.push(resolveAttributeLabel(attr, value, formData.customAttributes));
    }
  }

  if (formData.lot) parts.push(`L${formData.lot}`);
  if (formData.serialNo) parts.push(`#${formData.serialNo}`);
  if (formData.expirationDate) parts.push(formatDateToDMY(formData.expirationDate));
  if (formData.guaranteeDate) parts.push(formatDateToDMY(formData.guaranteeDate));

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
  } = useAttributeInstanceData(open && currentInstanceId ? currentInstanceId : null);

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
      logger.debug("Pre-populating form with instance data:", instanceData);
      setFormData({
        lot: instanceData.lot,
        serialNo: instanceData.serialNo,
        expirationDate: instanceData.expirationDate,
        guaranteeDate: instanceData.guaranteeDate,
        description: "",
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

  // Auto-computed description preview (read-only, like Classic)
  const computedDescription = useMemo(() => buildDescription(formData, customAttributes), [formData, customAttributes]);

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
      const result = await saveInstance({
        attributeSetId,
        instanceId: currentInstanceId,
        productId: productId || undefined,
        windowId: windowId || undefined,
        lot: formData.lot || undefined,
        serialNo: formData.serialNo || undefined,
        expirationDate: formData.expirationDate || undefined,
        guaranteeDate: formData.guaranteeDate || undefined,
        description: computedDescription,
        customAttributes: Object.keys(formData.customAttributes).length > 0 ? formData.customAttributes : undefined,
      });

      onSave(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error saving attribute set instance";
      setSaveError(errorMessage);
    }
  }, [
    config,
    saving,
    attributeSetId,
    formData,
    computedDescription,
    currentInstanceId,
    productId,
    windowId,
    saveInstance,
    onSave,
  ]);

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
            data-testid={"TextInput__" + field.id}
          />
        )}
        {config.isSerNo && (
          <TextInput
            label="Serial Number"
            field={{ ...field, isMandatory: false, name: "serialNo", hqlName: "serialNo" }}
            value={formData.serialNo}
            onChange={(e) => handleInputChange("serialNo", e.target.value)}
            className="w-full"
            data-testid={"TextInput__" + field.id}
          />
        )}
        {config.isExpirationDate && (
          <div className="w-full font-['Inter'] font-medium">
            <DateInput
              label="Expiration Date"
              field={{ ...field, isMandatory: false, name: "expirationDate", hqlName: "expirationDate" }}
              value={formData.expirationDate}
              currentValue={formData.expirationDate}
              onChange={(e) => handleDateChange("expirationDate", e)}
              data-testid={"DateInput__" + field.id}
            />
          </div>
        )}
        {config.isGuaranteeDate && (
          <div className="w-full font-['Inter'] font-medium">
            <DateInput
              label="Guarantee Date"
              field={{ ...field, isMandatory: false, name: "guaranteeDate", hqlName: "guaranteeDate" }}
              value={formData.guaranteeDate}
              currentValue={formData.guaranteeDate}
              onChange={(e) => handleDateChange("guaranteeDate", e)}
              data-testid={"DateInput__" + field.id}
            />
          </div>
        )}
        <TextInput
          label="Description"
          field={{ ...field, isMandatory: false, name: "description", hqlName: "description" }}
          value={computedDescription}
          readOnly
          className="w-full"
          data-testid={"TextInput__" + field.id}
        />
      </>
    );
  };

  const renderCustomAttributes = () => {
    if (customAttributes.length === 0) return null;

    return customAttributes.map((attr) => {
      // Normalize search to be case-insensitive for ID matching
      const attrIdLower = attr.id.toLowerCase();
      const formDataKeys = Object.keys(formData.customAttributes);

      const matchingKey = formDataKeys.find((k) => k.toLowerCase() === attrIdLower) || attr.id;
      const selectedValue = formData.customAttributes[matchingKey] || "";

      // Look for the identifier if it was returned by FETCH
      const identifierKey = `${matchingKey}_identifier`;
      const selectedIdentifier = formData.customAttributes[identifierKey] || "";

      if (attr.isList) {
        const options: Option[] = attr.values.map((v) => ({
          id: v.id,
          title: v.name,
          value: v.id,
        }));

        // Find option with case-insensitive value matching
        const selectedValueLower = selectedValue.toLowerCase();
        let selectedOption = options.find((o) => o.value.toLowerCase() === selectedValueLower) || null;

        // If not found but we have an identifier, create a virtual option so it's not empty
        if (!selectedOption && selectedValue && selectedIdentifier) {
          selectedOption = {
            id: selectedValue,
            title: selectedIdentifier,
            value: selectedValue,
          };
          // Optionally add it to the list if the Select component needs it
          options.push(selectedOption);
        }

        if (selectedValue && !selectedOption) {
          logger.warn(`Attribute ${attr.name} (${attr.id}): value "${selectedValue}" not found in options`, options);
        }

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
              data-testid={"Select__" + field.id}
            />
          </div>
        );
      }

      return (
        <TextInput
          key={attr.id}
          label={attr.name}
          field={{ ...field, isMandatory: attr.isMandatory, name: attr.id, hqlName: attr.id }}
          value={selectedValue}
          onChange={(e) => handleCustomAttributeChange(attr.id, e.target.value)}
          className="w-full"
          data-testid={"TextInput__" + field.id}
        />
      );
    });
  };

  const combinedError = configError || dataError || saveError || saveHookError;
  const isLoading = configLoading || dataLoading;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      tittleHeader="Attribute Selector"
      descriptionText=""
      HeaderIcon={SearchOutlined}
      showHeader
      buttons={
        <div className="flex gap-2 flex-1">
          <Button
            className="flex-[1_0_0]"
            variant="outlined"
            onClick={onCancel}
            disabled={saving}
            data-testid={"Button__" + field.id}>
            Cancel
          </Button>
          <Button
            className="flex-[1_0_0]"
            variant="filled"
            onClick={handleSave}
            disabled={!hasRequiredFields || saving || isLoading || !config}
            data-testid={"Button__" + field.id}>
            {saving ? (
              <div className="flex items-center gap-2">
                <Spinner data-testid={"Spinner__" + field.id} />
                <span>Saving...</span>
              </div>
            ) : (
              "OK"
            )}
          </Button>
        </div>
      }
      data-testid={"Modal__" + field.id}>
      <div className="space-y-4 p-4">
        {combinedError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{String(combinedError)}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Spinner data-testid={"Spinner__" + field.id} />
          </div>
        )}

        {!isLoading && !attributeSetId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-600">
              No Attribute Set is configured for this product. Please select a product with an Attribute Set first.
            </p>
          </div>
        )}

        {!isLoading && config && (
          <>
            {renderCustomAttributes()}
            {renderStandardFields()}
          </>
        )}
      </div>
    </Modal>
  );
};

export default AttributeSetInstanceModal;
