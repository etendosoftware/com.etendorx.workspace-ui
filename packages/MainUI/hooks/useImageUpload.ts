"use client";

import { useState, useCallback } from "react";
import { useUserContext } from "./useUserContext";
import { useTranslation } from "./useTranslation";

interface UploadImageParams {
  file: File;
  columnName: string;
  tabId: string;
  orgId: string;
  existingImageId?: string;
  imageSizeAction?: string;
  imageWidth?: number;
  imageHeight?: number;
}

interface UploadResult {
  imageId: string;
  action: string;
  oldWidth: number;
  oldHeight: number;
  newWidth: number;
  newHeight: number;
}

interface UseImageUploadReturn {
  uploadImage: (params: UploadImageParams) => Promise<UploadResult>;
  deleteUploadedImage: (imageId: string) => Promise<void>;
  isUploading: boolean;
  error: string | null;
}

function parseCallbackFromHtml(html: string): UploadResult | null {
  const match = html.match(
    /selector\.callback\('([A-Fa-f0-9]*)'\s*,\s*'([^']*)'\s*(?:,\s*'?(\d+)'?\s*,\s*'?(\d+)'?\s*,\s*'?(\d+)'?\s*,\s*'?(\d+)'?)?/
  );
  if (!match) return null;

  const imageId = match[1] ?? "";
  const action = match[2] ?? "N";
  const oldWidth = match[3] ? Number(match[3]) : 0;
  const oldHeight = match[4] ? Number(match[4]) : 0;
  const newWidth = match[5] ? Number(match[5]) : 0;
  const newHeight = match[6] ? Number(match[6]) : 0;

  return { imageId, action, oldWidth, oldHeight, newWidth, newHeight };
}

export const useImageUpload = (): UseImageUploadReturn => {
  const { token } = useUserContext();
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (params: UploadImageParams): Promise<UploadResult> => {
      if (!token) {
        throw new Error(t("errors.authentication.message"));
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
        formData.append("imageSizeAction", params.imageSizeAction ?? "N");
        formData.append("imageWidthValue", String(params.imageWidth ?? 0));
        formData.append("imageHeightValue", String(params.imageHeight ?? 0));
        formData.append("inpSelectorId", "isc_OBImageSelector_0");

        const uploadResponse = await fetch("/api/erp/utility/ImageInfoBLOB", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `${t("image.upload.errors.uploadFailed")}: ${uploadResponse.status} ${uploadResponse.statusText}`
          );
        }

        const responseText = await uploadResponse.text();
        const parsed = parseCallbackFromHtml(responseText);

        if (!parsed || !parsed.imageId) {
          throw new Error(t("image.upload.errors.parseIdFailed"));
        }

        return parsed;
      } catch (err) {
        const message = err instanceof Error ? err.message : t("image.upload.errors.uploadFailed");
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [token, t]
  );

  const deleteUploadedImage = useCallback(
    async (imageId: string): Promise<void> => {
      if (!imageId) return;

      const formData = new FormData();
      formData.append("Command", "DELETE_OB3");
      formData.append("imageId", imageId);

      try {
        await fetch("/api/erp/utility/ImageInfoBLOB", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } catch {
        // fire-and-forget: ignore errors on delete
      }
    },
    [token]
  );

  return { uploadImage, deleteUploadedImage, isUploading, error };
};
