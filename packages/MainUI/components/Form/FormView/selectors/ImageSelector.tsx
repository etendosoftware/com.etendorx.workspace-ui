"use client";

import type { Field } from "@workspaceui/api-client/src/api/types";
import type { TranslateFunction } from "@/hooks/types";
import { useState, useCallback, useMemo, useRef, type DragEvent, type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useTabContext } from "@/contexts/tab";
import { useUserContext } from "@/hooks/useUserContext";
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useTranslation } from "@/hooks/useTranslation";
import ConfirmModal from "@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal";
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

// Returns a dimension value as string, substituting "ANY" for unconfigured (0) dimensions
function dimStr(value: number): string {
  return value === 0 ? "ANY" : String(value);
}

const interpolate = (template: string, vars: Record<string, string>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");

// Returns the post-upload constraint message.
// For ALLOWED*/RECOMMENDED*: oldW/oldH = configured dim (p3/p4), newW/newH = actual uploaded dim (p5/p6).
// For RESIZE*: oldW/oldH = original image dim, newW/newH = resized result dim.
function buildConstraintMessage(
  action: string,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
  t: TranslateFunction
): string {
  switch (action) {
    case "ALLOWED":
      return interpolate(t("image.sizeConstraints.error.ALLOWED"), {
        configWidth: dimStr(oldW),
        configHeight: dimStr(oldH),
        actualWidth: dimStr(newW),
        actualHeight: dimStr(newH),
      });
    case "ALLOWED_MINIMUM":
      return interpolate(t("image.sizeConstraints.error.ALLOWED_MINIMUM"), {
        configWidth: dimStr(oldW),
        configHeight: dimStr(oldH),
        actualWidth: dimStr(newW),
        actualHeight: dimStr(newH),
      });
    case "ALLOWED_MAXIMUM":
      return interpolate(t("image.sizeConstraints.error.ALLOWED_MAXIMUM"), {
        configWidth: dimStr(oldW),
        configHeight: dimStr(oldH),
        actualWidth: dimStr(newW),
        actualHeight: dimStr(newH),
      });
    case "RECOMMENDED":
      return interpolate(t("image.sizeConstraints.confirm.RECOMMENDED"), {
        configWidth: dimStr(oldW),
        configHeight: dimStr(oldH),
        actualWidth: dimStr(newW),
        actualHeight: dimStr(newH),
      });
    case "RECOMMENDED_MINIMUM":
      return interpolate(t("image.sizeConstraints.confirm.RECOMMENDED_MINIMUM"), {
        configWidth: dimStr(oldW),
        configHeight: dimStr(oldH),
        actualWidth: dimStr(newW),
        actualHeight: dimStr(newH),
      });
    case "RECOMMENDED_MAXIMUM":
      return interpolate(t("image.sizeConstraints.confirm.RECOMMENDED_MAXIMUM"), {
        configWidth: dimStr(oldW),
        configHeight: dimStr(oldH),
        actualWidth: dimStr(newW),
        actualHeight: dimStr(newH),
      });
    default:
      if (action.startsWith("RESIZE_")) {
        return interpolate(t("image.sizeConstraints.confirm.RESIZE"), {
          originalWidth: dimStr(oldW),
          originalHeight: dimStr(oldH),
          targetWidth: dimStr(newW),
          targetHeight: dimStr(newH),
        });
      }
      return "";
  }
}

const ImageSelector = ({ field, isReadOnly }: ImageSelectorProps) => {
  const { t } = useTranslation();
  const { setValue, watch } = useFormContext();
  const { tab } = useTabContext();
  const { session, currentOrganization } = useUserContext();
  const { uploadImage, deleteUploadedImage, isUploading } = useImageUpload();

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now());
  const [isDragging, setIsDragging] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{
    imageId: string;
    message: string;
  } | null>(null);
  const [pendingError, setPendingError] = useState<{ message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageId = watch(field.hqlName);

  const orgId = useMemo(() => {
    return (session?.["#AD_Org_ID"] || session?.adOrgId || currentOrganization?.id || "") as string;
  }, [session, currentOrganization]);

  const columnName = field.columnName || field.hqlName;
  const tabId = tab?.id || "";

  // Size constraint config from field column metadata
  const configSizeAction = (field.column?.imageSizeValuesAction as string) ?? "N";
  const configW = Number(field.column?.imageWidth ?? 0);
  const configH = Number(field.column?.imageHeight ?? 0);

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
          imageSizeAction: configSizeAction,
          imageWidth: configW,
          imageHeight: configH,
        });

        const action = result.action;

        if (action === "WRONGFORMAT") {
          if (result.imageId) void deleteUploadedImage(result.imageId);
          setPendingError({ message: t("image.sizeConstraints.error.WRONGFORMAT") });
          return;
        }

        if (action === "ERROR_UPLOADING") {
          if (result.imageId) void deleteUploadedImage(result.imageId);
          setPendingError({ message: t("image.sizeConstraints.error.ERROR_UPLOADING") });
          return;
        }

        if (action.startsWith("RESIZE_")) {
          // For RESIZE_ASPECTRATIONL: if image was already smaller than target, backend returns it unchanged
          const shouldSkip =
            action === "RESIZE_ASPECTRATIONL" &&
            result.oldWidth === result.newWidth &&
            result.oldHeight === result.newHeight;

          if (!shouldSkip) {
            setPendingConfirm({
              imageId: result.imageId,
              message: buildConstraintMessage(
                action,
                result.oldWidth,
                result.oldHeight,
                result.newWidth,
                result.newHeight,
                t
              ),
            });
            return;
          }
          setValue(field.hqlName, result.imageId, { shouldDirty: true });
          setCacheBuster(Date.now());
          return;
        }

        if (action === "ALLOWED" || action === "ALLOWED_MINIMUM" || action === "ALLOWED_MAXIMUM") {
          // oldWidth/oldHeight = configured dimension (p3/p4); newWidth/newHeight = actual uploaded dim (p5/p6)
          let violated = false;
          if (action === "ALLOWED") {
            violated =
              (result.oldWidth !== 0 && result.oldWidth !== result.newWidth) ||
              (result.oldHeight !== 0 && result.oldHeight !== result.newHeight);
          } else if (action === "ALLOWED_MINIMUM") {
            violated =
              (result.oldWidth !== 0 && result.oldWidth > result.newWidth) ||
              (result.oldHeight !== 0 && result.oldHeight > result.newHeight);
          } else {
            // ALLOWED_MAXIMUM
            violated =
              (result.oldWidth !== 0 && result.oldWidth < result.newWidth) ||
              (result.oldHeight !== 0 && result.oldHeight < result.newHeight);
          }

          if (violated) {
            setPendingError({
              message: buildConstraintMessage(
                action,
                result.oldWidth,
                result.oldHeight,
                result.newWidth,
                result.newHeight,
                t
              ),
            });
            void deleteUploadedImage(result.imageId);
            return;
          }
          setValue(field.hqlName, result.imageId, { shouldDirty: true });
          setCacheBuster(Date.now());
          return;
        }

        if (action === "RECOMMENDED" || action === "RECOMMENDED_MINIMUM" || action === "RECOMMENDED_MAXIMUM") {
          // oldWidth/oldHeight = configured dimension (p3/p4); newWidth/newHeight = actual uploaded dim (p5/p6)
          let violated = false;
          if (action === "RECOMMENDED") {
            violated =
              (result.oldWidth !== 0 && result.oldWidth !== result.newWidth) ||
              (result.oldHeight !== 0 && result.oldHeight !== result.newHeight);
          } else if (action === "RECOMMENDED_MINIMUM") {
            violated =
              (result.oldWidth !== 0 && result.oldWidth > result.newWidth) ||
              (result.oldHeight !== 0 && result.oldHeight > result.newHeight);
          } else {
            // RECOMMENDED_MAXIMUM
            violated =
              (result.oldWidth !== 0 && result.oldWidth < result.newWidth) ||
              (result.oldHeight !== 0 && result.oldHeight < result.newHeight);
          }

          if (violated) {
            setPendingConfirm({
              imageId: result.imageId,
              message: buildConstraintMessage(
                action,
                result.oldWidth,
                result.oldHeight,
                result.newWidth,
                result.newHeight,
                t
              ),
            });
            return;
          }
          setValue(field.hqlName, result.imageId, { shouldDirty: true });
          setCacheBuster(Date.now());
          return;
        }

        // Default: action "N" or unknown
        setValue(field.hqlName, result.imageId, { shouldDirty: true });
        setCacheBuster(Date.now());
        toast.success(t("image.upload.success"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("image.upload.errors.uploadFailed"));
      }
    },
    [
      uploadImage,
      deleteUploadedImage,
      columnName,
      tabId,
      orgId,
      imageId,
      field.hqlName,
      setValue,
      t,
      configSizeAction,
      configW,
      configH,
    ]
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
  const emptyContent = !imageId ? (
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
        <Spinner size={24} data-testid={`Spinner__${field.id}`} />
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
  ) : null;

  // Image exists - show preview with overlay actions
  const filledContent = imageId ? (
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
          <Spinner size={28} data-testid={`Spinner__${field.id}`} />
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
  ) : null;

  return (
    <>
      {fileInput}
      {emptyContent}
      {filledContent}
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
      {pendingConfirm && (
        <ConfirmModal
          open={true}
          confirmText={pendingConfirm.message}
          onConfirm={() => {
            setValue(field.hqlName, pendingConfirm.imageId, { shouldDirty: true });
            setCacheBuster(Date.now());
            setPendingConfirm(null);
          }}
          onCancel={() => {
            void deleteUploadedImage(pendingConfirm.imageId);
            setPendingConfirm(null);
          }}
        />
      )}
      {pendingError && (
        <ConfirmModal
          open={true}
          confirmText={pendingError.message}
          saveLabel={t("common.close")}
          hideSecondaryButton={true}
          onConfirm={() => setPendingError(null)}
          onCancel={() => setPendingError(null)}
        />
      )}
    </>
  );
};

export { ImageSelector };
export default ImageSelector;
