"use client";

import type { Field } from "@workspaceui/api-client/src/api/types";
import { useState, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTabContext } from "@/contexts/tab";
import { useUserContext } from "@/hooks/useUserContext";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useTranslation } from "@/hooks/useTranslation";
import ImageUploadModal from "./ImageUploadModal";
import ImagePreviewModal from "./ImagePreviewModal";

interface ImageSelectorProps {
  field: Field;
  isReadOnly?: boolean;
}

const ImageSelector = ({ field, isReadOnly }: ImageSelectorProps) => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext();
  const { tab } = useTabContext();
  const { session, currentOrganization } = useUserContext();
  const { uploadImage, isUploading } = useImageUpload();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  const imageId = watch(field.hqlName);

  const orgId = useMemo(() => {
    return (session?.["#AD_Org_ID"] || session?.adOrgId || currentOrganization?.id || "") as string;
  }, [session, currentOrganization]);

  const columnName = field.columnName || field.hqlName;
  const tabId = tab?.id || "";

  const imageUrl = useAuthenticatedImage(imageId || null, cacheBuster);

  const handleUploadComplete = useCallback(
    (newImageId: string) => {
      setValue(field.hqlName, newImageId, { shouldDirty: true });
      setCacheBuster(Date.now());
    },
    [field.hqlName, setValue]
  );

  const handleDelete = useCallback(() => {
    setValue(field.hqlName, null, { shouldDirty: true });
  }, [field.hqlName, setValue]);

  const handleOpenUpload = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const handleOpenPreview = useCallback(() => {
    if (imageUrl) setShowPreviewModal(true);
  }, [imageUrl]);

  // No image - show upload placeholder
  if (!imageId) {
    return (
      <>
        <button
          type="button"
          onClick={isReadOnly ? undefined : handleOpenUpload}
          disabled={isReadOnly}
          className={`flex items-center gap-3 h-10 px-3 border border-dashed rounded-md transition-colors w-full ${
            isReadOnly
              ? "border-gray-200 bg-gray-50 cursor-default"
              : "border-gray-300 hover:border-[var(--color-etendo-main)] cursor-pointer"
          }`}
          data-testid={`ImageSelector__empty__${field.id}`}>
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-gray-400 flex-shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!isReadOnly && <span className="text-sm text-gray-500">{t("image.selector.clickToUpload")}</span>}
          {isReadOnly && <span className="text-sm text-gray-400">{t("image.selector.noImage")}</span>}
        </button>

        <ImageUploadModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
          uploadImage={uploadImage}
          isUploading={isUploading}
          columnName={columnName}
          tabId={tabId}
          orgId={orgId}
        />
      </>
    );
  }

  // Image exists - show thumbnail with actions
  return (
    <>
      <div
        className="group relative flex items-center gap-3 h-10 px-3 border border-gray-200 rounded-md bg-gray-50 overflow-hidden"
        data-testid={`ImageSelector__filled__${field.id}`}>
        {/* Thumbnail */}
        <button
          type="button"
          className="w-8 h-8 flex-shrink-0 rounded overflow-hidden cursor-pointer p-0 border-0 bg-transparent"
          onClick={handleOpenPreview}>
          <img
            src={imageUrl || ""}
            alt={field.name || t("image.selector.altText")}
            className="w-full h-full object-cover"
            data-testid={`ImageSelector__thumbnail__${field.id}`}
          />
        </button>

        {/* Click area to preview */}
        <button
          type="button"
          onClick={handleOpenPreview}
          className="flex-1 text-left text-sm text-[var(--color-etendo-main)] hover:underline truncate"
          data-testid={`ImageSelector__viewBtn__${field.id}`}>
          {t("image.selector.viewImage")}
        </button>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleOpenUpload}
              className="p-1 text-gray-500 hover:text-[var(--color-etendo-main)] rounded transition-colors"
              title={t("image.preview.replaceImage")}
              data-testid={`ImageSelector__editBtn__${field.id}`}>
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path
                  d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 text-gray-500 hover:text-red-500 rounded transition-colors"
              title={t("image.selector.removeImage")}
              data-testid={`ImageSelector__deleteBtn__${field.id}`}>
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <ImageUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
        uploadImage={uploadImage}
        isUploading={isUploading}
        columnName={columnName}
        tabId={tabId}
        orgId={orgId}
        existingImageId={imageId}
      />

      {/* Preview Modal */}
      {imageUrl && (
        <ImagePreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          imageUrl={imageUrl}
          isReadOnly={isReadOnly}
          onEdit={handleOpenUpload}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export { ImageSelector };
export default ImageSelector;
