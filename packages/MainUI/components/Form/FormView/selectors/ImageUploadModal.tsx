"use client";

import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from "react";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "@/hooks/useTranslation";

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (imageId: string) => void;
  uploadImage: (params: {
    file: File;
    columnName: string;
    tabId: string;
    orgId: string;
    existingImageId?: string;
  }) => Promise<{ imageId: string }>;
  isUploading: boolean;
  columnName: string;
  tabId: string;
  orgId: string;
  existingImageId?: string;
}

const ImageUploadModal = ({
  open,
  onClose,
  onUploadComplete,
  uploadImage,
  isUploading,
  columnName,
  tabId,
  orgId,
  existingImageId,
}: ImageUploadModalProps) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError(t("image.upload.errors.invalidFile"));
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    [t]
  );

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

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploadError(null);

    try {
      const result = await uploadImage({
        file: selectedFile,
        columnName,
        tabId,
        orgId,
        existingImageId,
      });
      onUploadComplete(result.imageId);
      handleClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("image.upload.errors.uploadFailed"));
    }
  }, [selectedFile, uploadImage, columnName, tabId, orgId, existingImageId, onUploadComplete, t]);

  const handleClose = useCallback(() => {
    if (isUploading) return;
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadError(null);
    setIsDragging(false);
    onClose();
  }, [isUploading, previewUrl, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center" data-testid="ImageUploadModal__backdrop">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
        role="presentation"
      />
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        data-testid="ImageUploadModal__container">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {existingImageId ? t("image.upload.titleReplace") : t("image.upload.titleNew")}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="ImageUploadModal__closeBtn">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Drop zone */}
        {!previewUrl ? (
          <button
            type="button"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-[var(--color-etendo-main)] bg-[var(--color-etendo-main)]/5"
                : "border-gray-300 hover:border-gray-400"
            }`}
            data-testid="ImageUploadModal__dropzone">
            <svg
              aria-hidden="true"
              className="mx-auto mb-3 text-gray-400"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-gray-600">{t("image.upload.dropZoneText")}</p>
            <p className="text-xs text-gray-400 mt-1">{t("image.upload.supportedFormats")}</p>
          </button>
        ) : (
          <div className="relative rounded-lg overflow-hidden bg-gray-100 mb-4">
            <img
              src={previewUrl}
              alt={t("image.preview.altText")}
              className="w-full max-h-64 object-contain"
              data-testid="ImageUploadModal__preview"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={isUploading}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
              data-testid="ImageUploadModal__removePreview">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <p className="text-xs text-gray-500 text-center py-2">{selectedFile?.name}</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          data-testid="ImageUploadModal__fileInput"
        />

        {/* Error */}
        {uploadError && (
          <p className="text-sm text-red-600 mt-2" data-testid="ImageUploadModal__error">
            {uploadError}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            data-testid="ImageUploadModal__cancelBtn">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 text-sm text-white bg-[var(--color-etendo-main)] rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            data-testid="ImageUploadModal__uploadBtn">
            {isUploading && <CircularProgress size={14} color="inherit" />}
            {isUploading ? t("image.upload.uploading") : t("image.upload.uploadButton")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
