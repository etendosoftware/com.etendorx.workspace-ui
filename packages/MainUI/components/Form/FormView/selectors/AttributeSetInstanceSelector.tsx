/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type React from "react";
import { useState, useCallback, useEffect, useContext } from "react";
import { useFormContext } from "react-hook-form";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import CustomModal from "@workspaceui/componentlibrary/src/components/Modal/CustomModal";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useWindowContext } from "@/contexts/window";
import { UserContext } from "@/contexts/user";

export type AttributeSetInstanceSelectorProps = {
  field: Field;
  isReadOnly: boolean;
};

const AttributeSetInstanceSelector: React.FC<AttributeSetInstanceSelectorProps> = ({ field, isReadOnly }) => {
  const { watch, setValue } = useFormContext();
  const { t } = useTranslation();
  const { token } = useContext(UserContext);
  const { activeWindow } = useWindowContext();
  const windowId = activeWindow?.windowId || "";
  const value = watch(field.hqlName);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState("");

  const displayValue = watch(`${field.hqlName}$_identifier`) || value?._identifier || "";

  const handleOpenModal = useCallback(() => {
    if (isReadOnly) return;

    // DEBUG: Inspect available data to map parameters correctly
    console.log("AttributeSetInstanceSelector - Debug Info:");
    console.log("Form Values (watch()):", watch());
    console.log("Window ID:", windowId);
    console.log("Field:", field);
    console.log("Current Value:", value);

    // Build the iframe URL with initialization parameters
    const params = new URLSearchParams();
    
    // Extract data from form state
    const formData = watch();
    
    // Determine Product ID
    let productId = "";
    if (formData._entityName === 'Product') {
      productId = formData.id;
    } else if (formData.product) {
      productId = typeof formData.product === 'object' ? formData.product.id : formData.product;
    } else if (formData.mProduct) {
      productId = typeof formData.mProduct === 'object' ? formData.mProduct.id : formData.mProduct;
    } else if (formData.inpProduct) {
       productId = formData.inpProduct;
    }

    // Determine Attribute Set ID
    let attributeSetId = "";
    if (formData.attributeSet) {
      attributeSetId = typeof formData.attributeSet === 'object' ? formData.attributeSet.id : formData.attributeSet;
    } else if (formData.mAttributesetId) {
      attributeSetId = typeof formData.mAttributesetId === 'object' ? formData.mAttributesetId.id : formData.mAttributesetId;
    } else if (formData.product_data?.attributeSet) {
      attributeSetId = formData.product_data.attributeSet;
    }

    // Determine Key Value (Current Instance ID)
    const rawValue = watch(field.hqlName);
    const inpKeyValue = (typeof rawValue === 'object' ? rawValue?.id : rawValue) || "";

    // Determine Name Value
    const inpNameValue = watch(`${field.hqlName}$_identifier`) || "";

    // Determine isSOTrx
    const isSOTrx = (activeWindow as any)?.isSOTrx ? "Y" : "N";

    params.append("inpNameValue", inpNameValue);
    params.append("inpKeyValue", inpKeyValue);
    params.append("WindowID", windowId);
    params.append("inpwindowId", windowId);
    params.append("inpProduct", productId);
    params.append("inpmAttributesetId", attributeSetId);
    params.append("IsPopUpCall", "1");
    params.append("isSOTrx", isSOTrx);
    params.append("Command", "DISPLAY");
    if (token) {
      params.append("token", token);
    }

    // Use Next.js API proxy route - note the double slash in "etendo//info"
    // This goes through /api/erp/[...slug] and triggers isMutationRoute for session handling
    const url = `/api/erp/meta/legacy/info/AttributeSetInstance.html?${params.toString()}`;
    
    setIframeUrl(url);
    setIsModalOpen(true);
  }, [isReadOnly, field.hqlName, watch, windowId]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setIframeUrl("");
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
  }, []);

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from the iframe
      if (!event.data) return;

      // Check if it's a close/success message from AttributeSetInstance
      if (event.data.action === "closeModal" || event.data.action === "attributeSetInstanceSelected") {
        if (event.data.value) {
          // Update form with selected value
          const selectedId = event.data.value.id || event.data.value;
          const selectedIdentifier = event.data.value._identifier || event.data.value.identifier || "";

          setValue(field.hqlName, selectedId);
          setValue(`${field.hqlName}$_identifier`, selectedIdentifier);
          
          // Store full data if available
          if (event.data.value.id) {
            setValue(`${field.hqlName}_data`, {
              id: selectedId,
              _identifier: selectedIdentifier,
              _entityName: "AttributeSetInstance",
              ...event.data.value,
            });
          }
        }
        
        handleCloseModal();
      }
    };

    window.addEventListener("message", handleMessage);
    
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [field.hqlName, setValue, handleCloseModal]);

  // Reset iframe loading state when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setIframeLoading(true);
    }
  }, [isModalOpen]);

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
          }}
          data-testid="AttributeSetInstanceSelector__input"
        >
          <div className="flex items-center gap-2">
            <SearchOutlined fill="#6B7280" className="w-4 h-4" data-testid="SearchOutlined__icon" />
            <span className={`text-sm ${displayValue ? "text-gray-900" : "text-gray-500"}`}>
              {displayValue || "Select Attribute Set Instance"}
            </span>
          </div>
        </div>
      </div>
      <CustomModal
        isOpen={isModalOpen}
        title="Attribute Selector"
        iframeLoading={iframeLoading}
        url={iframeUrl}
        handleIframeLoad={handleIframeLoad}
        handleClose={handleCloseModal}
        texts={{
          loading: t("common.loading"),
          iframeTitle: "Attribute Set Instance Selector",
          noData: t("common.noDataAvailable"),
          closeButton: t("common.close"),
        }}
        data-testid="AttributeSetInstanceModal"
      />
    </>
  );
};

export default AttributeSetInstanceSelector;
