"use client";

import type { Field } from "@workspaceui/api-client/src/api/types";
import { useState, useCallback, useMemo, useRef, type DragEvent, type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useTabContext } from "@/contexts/tab";
import { useUserContext } from "@/hooks/useUserContext";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useTranslation } from "@/hooks/useTranslation";
import ImagePreviewModal from "./ImagePreviewModal";

interface ImageSelectorProps {
  field: Field;
  isReadOnly?: boolean;
}

const Spinner = ({ size = 24 }: { size?: number }) => (
  <svg
    className="animate-spin text-[var(--color-etendo-main)]"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="32"
      strokeDashoffset="12"
      strokeLinecap="round"
    />
  </svg>
);

const ImageSelector = ({ field, isReadOnly }: ImageSelectorProps) => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext();
  const { tab } = useTabContext();
  const { session, currentOrganization } = useUserContext();
  const { uploadImage, isUploading } = useImageUpload();

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageId = watch(field.hqlName);

  const orgId = useMemo(() => {
    return (session?.["#AD_Org_ID"] || session?.adOrgId || currentOrganization?.id || "") as string;
  }, [session, currentOrganization]);

  const columnName = field.columnName || field.hqlName;
  const tabId = tab?.id || "";

  const imageUrl = useAuthenticatedImage(imageId || null, cacheBuster);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error(t("image.upload.errors.invalidFile"));
        return;
      }
      try {
        const result = await uploadImage({
          file,
          columnName,
          tabId,
          orgId,
          existingImageId: imageId || undefined,
        });
        setValue(field.hqlName, result.imageId, { shouldDirty: true });
        setCacheBuster(Date.now());
        toast.success(t("image.upload.success"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("image.upload.errors.uploadFailed"));
      }
    },
    [uploadImage, columnName, tabId, orgId, imageId, field.hqlName, setValue, t]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFile]
  );

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDelete = useCallback(() => {
    setValue(field.hqlName, null, { shouldDirty: true });
  }, [field.hqlName, setValue]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const fileInput = !isReadOnly && (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="hidden"
      data-testid={`ImageSelector__fileInput__${field.id}`}
    />
  );

  const getButtonClasses = useCallback(() => {
    if (isUploading) return "border-gray-300 bg-gray-50 cursor-wait";
    if (isDragging) return "border-[var(--color-etendo-main)] bg-[var(--color-etendo-main)]/5 cursor-copy";
    if (isReadOnly) return "border-gray-200 bg-gray-50 cursor-default";
    return "border-gray-300 hover:border-[var(--color-etendo-main)] cursor-pointer";
  }, [isUploading, isDragging, isReadOnly]);

  const buttonDynamicClasses = useMemo(() => getButtonClasses(), [getButtonClasses]);

  // No image - show upload placeholder
  if (!imageId) {
    return (
      <>
        {fileInput}
        <button
          type="button"
          onClick={isReadOnly ? undefined : handleOpenFilePicker}
          onDragOver={isReadOnly ? undefined : handleDragOver}
          onDragLeave={isReadOnly ? undefined : handleDragLeave}
          onDrop={isReadOnly ? undefined : handleDrop}
          disabled={isReadOnly || isUploading}
          className={`flex flex-col items-center justify-center gap-2 w-full h-full min-h-[150px] border border-dashed rounded-md transition-colors ${buttonDynamicClasses}`}
          data-testid={`ImageSelector__empty__${field.id}`}>
          {isUploading ? (
            <Spinner size={24} data-testid={"Spinner__" + field.id} />
          ) : (
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
          )}
          {isUploading && <span className="text-sm text-gray-500">{t("image.upload.uploading")}</span>}
          {!isUploading && !isReadOnly && (
            <span className="text-sm text-gray-500">{t("image.selector.clickToUpload")}</span>
          )}
          {!isUploading && isReadOnly && <span className="text-sm text-gray-400">{t("image.selector.noImage")}</span>}
        </button>
      </>
    );
  }

  // Image exists - show preview with overlay actions
  return (
    <>
      {fileInput}
      <div
        className={`group relative w-full h-full min-h-[150px] border rounded-md bg-gray-50 overflow-hidden flex items-center justify-center transition-colors ${
          isDragging ? "border-[var(--color-etendo-main)] bg-[var(--color-etendo-main)]/5" : "border-gray-200"
        }`}
        onDragOver={isReadOnly ? undefined : handleDragOver}
        onDragLeave={isReadOnly ? undefined : handleDragLeave}
        onDrop={isReadOnly ? undefined : handleDrop}
        data-testid={`ImageSelector__filled__${field.id}`}>
        {/* Thumbnail - click to preview */}
        <button
          type="button"
          className="p-0 border-0 bg-transparent cursor-pointer flex items-center justify-center"
          onClick={() => imageUrl && setShowPreviewModal(true)}>
          <img
            src={imageUrl || ""}
            alt={field.name || t("image.selector.altText")}
            className="max-h-[100px] w-auto max-w-full object-contain"
            data-testid={`ImageSelector__thumbnail__${field.id}`}
          />
        </button>

        {/* Spinner overlay while uploading */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Spinner size={28} data-testid={"Spinner__" + field.id} />
          </div>
        )}

        {/* Action buttons - top right, visible on hover */}
        {!isReadOnly && !isUploading && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleOpenFilePicker}
              className="p-2 bg-white/90 text-gray-700 rounded-full shadow-md border border-gray-200 hover:bg-[var(--color-etendo-main)] hover:text-white hover:border-transparent transition-colors"
              title={t("image.preview.replaceImage")}
              data-testid={`ImageSelector__editBtn__${field.id}`}>
              <svg
                aria-hidden="true"
                width="18"
                height="18"
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
              className="p-2 bg-white/90 text-gray-700 rounded-full shadow-md border border-gray-200 hover:bg-red-600 hover:text-white hover:border-transparent transition-colors"
              title={t("image.selector.removeImage")}
              data-testid={`ImageSelector__deleteBtn__${field.id}`}>
              <svg
                aria-hidden="true"
                width="18"
                height="18"
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
      {imageUrl && (
        <ImagePreviewModal
          open={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          imageUrl={imageUrl}
          isReadOnly={isReadOnly}
          onEdit={handleOpenFilePicker}
          onDelete={handleDelete}
          data-testid={`ImagePreviewModal__${field.id}`}
        />
      )}
    </>
  );
};

export { ImageSelector };
export default ImageSelector;
