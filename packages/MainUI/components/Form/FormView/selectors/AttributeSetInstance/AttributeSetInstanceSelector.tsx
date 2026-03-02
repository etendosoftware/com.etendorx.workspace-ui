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

const ATTRIBUTE_SET_KEYS = ["attributeSet", "mAttributeSet", "ATTRIBUTESET", "mAttributeSetId", "M_AttributeSet_ID"];

const PRODUCT_KEYS = ["product", "mProduct", "mProductId"];

const resolveFromFormValues = (values: Record<string, unknown>, keys: string[]): string | null => {
  const valueKeys = Object.keys(values);
  const lowerKeys = keys.map((k) => k.toLowerCase());

  for (const key of valueKeys) {
    if (lowerKeys.includes(key.toLowerCase())) {
      const val = values[key];
      if (val && typeof val === "string" && val.length > 5) {
        return val;
      }
    }
  }
  return null;
};

const resolveAttributeSetId = (values: Record<string, unknown>): string | null => {
  // 1. Direct form field (Product form has attributeSet as a sibling field)
  const direct = resolveFromFormValues(values, ATTRIBUTE_SET_KEYS);
  if (direct) {
    return direct;
  }

  // 2. From product _data object (transaction forms with product reference)
  for (const [key, val] of Object.entries(values)) {
    if (!key.endsWith("_data") || !val || typeof val !== "object") continue;
    const data = val as Record<string, unknown>;

    const possibleProps = [
      "attributeSet",
      "attributeSetId",
      "attributeSet$id",
      "mAttributeSet",
      "mAttributeSet$id",
      "product$attributeSet",
      "product$attributeSet$id",
      "ATTRIBUTESET",
    ];

    const dataValue = resolveFromFormValues(data, possibleProps);
    if (dataValue) {
      return dataValue;
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
  // Track the last saved instance ID for re-opening the modal in same session
  const [lastSavedInstanceId, setLastSavedInstanceId] = useState<string | null>(null);

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
      // Use shouldDirty and shouldTouch to ensure react-hook-form tracks the change
      setValue(fieldName, data.id, { shouldDirty: true, shouldTouch: true });
      setValue(`${fieldName}$_identifier`, data.description, { shouldDirty: true });
      setValue(
        `${fieldName}_data`,
        {
          id: data.id,
          _identifier: data.description,
          _entityName: "MaterialMgmtAttributeSetInstance",
        },
        { shouldDirty: true }
      );
      setDisplayValue(data.description);
      // Track the saved instance ID locally so we can pass it to the modal on reopen
      setLastSavedInstanceId(data.id);
      setIsModalOpen(false);
    },
    [fieldName, setValue]
  );

  const formValues = getValues();
  const attributeSetId = resolveAttributeSetId(formValues);
  let productId = resolveProductId(formValues);

  // Fallback for productId if we are in the Product window
  const entityName = formValues._entityName as string | undefined;
  if (!productId && entityName === "Product" && formValues.id) {
    productId = String(formValues.id);
  }

  // Resolve the current instance ID: prefer form value, then fallback to locally saved ID
  const resolvedInstanceId = value || lastSavedInstanceId || null;

  return (
    <>
      <div className="w-full">
        <div
          className={`flex items-center w-full px-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 transition-colors outline-none ${
            isReadOnly
              ? "bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent"
              : "bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none cursor-pointer"
          }`}
          onClick={handleOpenModal}
          tabIndex={isReadOnly ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isReadOnly) {
              e.preventDefault();
              handleOpenModal();
            }
          }}>
          <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
            <span
              className={`text-sm truncate font-medium ${displayValue ? "text-(--color-transparent-neutral-80)" : "text-baseline-60"}`}>
              {displayValue || "Select attribute..."}
            </span>
            <SearchOutlined
              fill="currentColor"
              className="w-4 h-4 flex-shrink-0 text-(--color-transparent-neutral-60)"
              data-testid={"SearchOutlined__" + field.id}
            />
          </div>
        </div>
      </div>
      <AttributeSetInstanceModal
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSave={handleSave}
        attributeSetId={attributeSetId}
        currentInstanceId={resolvedInstanceId}
        productId={productId}
        field={field}
        data-testid={"AttributeSetInstanceModal__" + field.id}
      />
    </>
  );
};

export default AttributeSetInstanceSelector;
