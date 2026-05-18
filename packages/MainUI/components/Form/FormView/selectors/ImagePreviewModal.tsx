"use client";

import { useState, useCallback, useRef, useEffect, type WheelEvent, type MouseEvent, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  isReadOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

const ImagePreviewModal = ({ open, onClose, imageUrl, isReadOnly, onEdit, onDelete }: ImagePreviewModalProps) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setShowDeleteConfirm(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [zoom, position]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    onDelete?.();
    onClose();
  }, [onDelete, onClose]);

  const getCursor = useCallback(() => {
    if (zoom <= 1) return "default";
    if (isDragging) return "grabbing";
    return "grab";
  }, [zoom, isDragging]);

  const cursor = useMemo(() => getCursor(), [getCursor]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex flex-col" data-testid="ImagePreviewModal__backdrop">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="presentation"
      />

      {/* Toolbar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
            title={t("image.preview.zoomOut")}
            data-testid="ImagePreviewModal__zoomOut">
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35M8 11h6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="text-white/80 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors text-sm font-medium min-w-[60px] text-center"
            title={t("image.preview.resetZoom")}
            data-testid="ImagePreviewModal__zoomReset">
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
            title={t("image.preview.zoomIn")}
            data-testid="ImagePreviewModal__zoomIn">
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit & Delete */}
          {!isReadOnly && onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit();
                onClose();
              }}
              className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
              title={t("image.preview.replaceImage")}
              data-testid="ImagePreviewModal__editBtn">
              <svg
                aria-hidden="true"
                width="20"
                height="20"
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
          )}
          {!isReadOnly && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-white/80 hover:text-red-400 p-1.5 rounded hover:bg-white/10 transition-colors"
              title={t("image.preview.deleteImage")}
              data-testid="ImagePreviewModal__deleteBtn">
              <svg
                aria-hidden="true"
                width="20"
                height="20"
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
          )}

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors ml-2"
            title={t("common.close")}
            data-testid="ImagePreviewModal__closeBtn">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor }}
        data-testid="ImagePreviewModal__imageContainer">
        <img
          src={imageUrl}
          alt={t("image.preview.altText")}
          className="max-w-full max-h-full object-contain pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? "none" : "transform 0.2s ease",
          }}
          draggable={false}
          data-testid="ImagePreviewModal__image"
        />
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDeleteConfirm(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowDeleteConfirm(false);
            }}
            role="presentation"
          />
          <div
            className="relative bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4"
            data-testid="ImagePreviewModal__deleteConfirm">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{t("image.preview.deleteConfirm.title")}</h4>
            <p className="text-sm text-gray-600 mb-4">{t("image.preview.deleteConfirm.message")}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                data-testid="ImagePreviewModal__deleteCancelBtn">
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                data-testid="ImagePreviewModal__deleteConfirmBtn">
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreviewModal;
