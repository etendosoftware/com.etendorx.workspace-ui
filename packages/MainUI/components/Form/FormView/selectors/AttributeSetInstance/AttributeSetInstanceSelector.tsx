import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import type { Field } from "@workspaceui/api-client/src/api/types";
import AttributeSetInstanceModal from "./AttributeSetInstanceModal";

interface AttributeSetInstanceSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

const ATTRIBUTE_SET_KEYS = ["attributeSet", "mAttributeSet"];

const PRODUCT_KEYS = ["product", "mProduct", "mProductId"];

const resolveFromFormValues = (
  values: Record<string, unknown>,
  keys: string[]
): string | null => {
  for (const key of keys) {
    const val = values[key];
    if (val && typeof val === "string" && val.length > 5) {
      return val;
    }
  }
  return null;
};

const resolveAttributeSetId = (values: Record<string, unknown>): string | null => {
  // 1. Direct form field (Product form has attributeSet as a sibling field)
  const direct = resolveFromFormValues(values, ATTRIBUTE_SET_KEYS);
  if (direct) return direct;

  // 2. From product _data object (transaction forms with product reference)
  for (const [key, val] of Object.entries(values)) {
    if (!key.endsWith("_data") || !val || typeof val !== "object") continue;
    const data = val as Record<string, unknown>;
    for (const prop of ["attributeSet", "product$attributeSet"]) {
      if (data[prop] && typeof data[prop] === "string") {
        return data[prop] as string;
      }
    }
  }

  return null;
};

const resolveProductId = (values: Record<string, unknown>): string | null => {
  return resolveFromFormValues(values, PRODUCT_KEYS);
};

const AttributeSetInstanceSelector: React.FC<AttributeSetInstanceSelectorProps> = ({ field, isReadOnly }) => {
  const { watch, setValue, getValues } = useFormContext();
  const fieldName = field.hqlName || field.columnName || field.name;

  const value = watch(fieldName);
  const identifier = watch(`${fieldName}$_identifier`);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    if (identifier) {
      setDisplayValue(String(identifier));
    } else if (value && typeof value === "string" && value !== displayValue) {
      setDisplayValue(value);
    } else if (!value && !identifier) {
      setDisplayValue("");
    }
  }, [value, identifier]);

  const handleOpenModal = useCallback(() => {
    if (isReadOnly) return;
    setIsModalOpen(true);
  }, [isReadOnly]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSave = useCallback(
    (data: { id: string; description: string }) => {
      setValue(fieldName, data.id);
      setValue(`${fieldName}$_identifier`, data.description);
      setValue(`${fieldName}_data`, {
        id: data.id,
        _identifier: data.description,
        _entityName: "MaterialMgmtAttributeSetInstance",
      });
      setDisplayValue(data.description);
      setIsModalOpen(false);
    },
    [fieldName, setValue]
  );

  const formValues = getValues();
  const attributeSetId = resolveAttributeSetId(formValues);
  const productId = resolveProductId(formValues);

  return (
    <>
      <div className="w-full">
        <div
          className={`flex items-center justify-between w-full h-10 px-3 border-b transition-colors ${
            isReadOnly ? "bg-gray-100 cursor-not-allowed" : "hover:border-gray-400 cursor-pointer border-gray-300"
          }`}
          onClick={handleOpenModal}
          tabIndex={isReadOnly ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isReadOnly) {
              e.preventDefault();
              handleOpenModal();
            }
          }}>
          <div className="flex items-center gap-2">
            <SearchOutlined fill="#6B7280" className="w-4 h-4" />
            <span className={`text-sm ${displayValue ? "text-gray-900" : "text-gray-500"}`}>
              {displayValue || "Select attribute..."}
            </span>
          </div>
        </div>
      </div>
      <AttributeSetInstanceModal
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSave={handleSave}
        attributeSetId={attributeSetId}
        currentInstanceId={value || null}
        productId={productId}
        field={field}
      />
    </>
  );
};

export default AttributeSetInstanceSelector;
