"use client";

import { useState, useCallback } from "react";
import { useUserContext } from "./useUserContext";

interface UploadImageParams {
  file: File;
  columnName: string;
  tabId: string;
  orgId: string;
  existingImageId?: string;
}

interface UploadResult {
  imageId: string;
  width?: number;
  height?: number;
}

interface UseImageUploadReturn {
  uploadImage: (params: UploadImageParams) => Promise<UploadResult>;
  isUploading: boolean;
  error: string | null;
}

function parseImageIdFromHtml(html: string): string | null {
  const match = html.match(/selector\.callback\('([A-Fa-f0-9]+)'/);
  return match?.[1] ?? null;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const { token } = useUserContext();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (params: UploadImageParams): Promise<UploadResult> => {
      if (!token) {
        throw new Error("Authentication token not available");
      }

      setIsUploading(true);
      setError(null);

      try {
        // Step 1: Upload image via ImageInfoBLOB
        const formData = new FormData();
        formData.append("inpFile", params.file, params.file.name);
        formData.append("Command", "SAVE_OB3");
        formData.append("inpColumnName", params.columnName);
        formData.append("inpTabId", params.tabId);
        formData.append("inpadOrgId", params.orgId);
        formData.append("parentObjectId", "");
        formData.append("imageId", params.existingImageId || "");
        formData.append("imageSizeAction", "N");
        formData.append("imageWidthValue", "0");
        formData.append("imageHeightValue", "0");
        formData.append("inpSelectorId", "isc_OBImageSelector_0");

        const uploadResponse = await fetch("/api/erp/utility/ImageInfoBLOB", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        const responseText = await uploadResponse.text();
        const imageId = parseImageIdFromHtml(responseText);

        if (!imageId) {
          throw new Error("Failed to parse image ID from upload response");
        }

        // Step 2: Call GETSIZE for backend compatibility
        let width: number | undefined;
        let height: number | undefined;

        try {
          const getSizeResponse = await fetch(
            `/api/erp/org.openbravo.client.kernel?inpimageId=${imageId}&command=GETSIZE&_action=org.openbravo.client.application.window.ImagesActionHandler`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json;charset=UTF-8",
              },
              body: "{}",
            }
          );

          if (getSizeResponse.ok) {
            const sizeData = await getSizeResponse.json();
            width = sizeData.width;
            height = sizeData.height;
          }
        } catch {
          // GETSIZE failure is non-critical
          console.error("GETSIZE request failed");
        }

        return { imageId, width, height };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Image upload failed";
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [token]
  );

  return { uploadImage, isUploading, error };
};
