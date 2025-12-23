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

import { useCallback, useRef, useEffect } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

export interface DropTargetState {
  rect: DOMRect;
  recordId: string;
}

interface UseRowDropZoneOptions {
  onFileDrop?: (files: File[], record: EntityData) => void;
  onDragStateChange?: (state: DropTargetState | null) => void;
  acceptedFileTypes?: string[]; // e.g., ['image/*', 'application/pdf']
  maxFiles?: number;
}

export const useRowDropZone = (options: UseRowDropZoneOptions = {}) => {
  const { onFileDrop, onDragStateChange, acceptedFileTypes, maxFiles = 10 } = options;

  // Use refs for options to ensure handlers are stable
  const onFileDropRef = useRef(onFileDrop);
  const onDragStateChangeRef = useRef(onDragStateChange);
  const acceptedFileTypesRef = useRef(acceptedFileTypes);
  const maxFilesRef = useRef(maxFiles);

  useEffect(() => {
    onFileDropRef.current = onFileDrop;
    onDragStateChangeRef.current = onDragStateChange;
    acceptedFileTypesRef.current = acceptedFileTypes;
    maxFilesRef.current = maxFiles;
  });

  /**
   * Validates if the dragged items are files and match accepted types
   */
  const validateFiles = useCallback((dataTransfer: DataTransfer): boolean => {
    const currentMaxFiles = maxFilesRef.current || 10;
    const currentAcceptedTypes = acceptedFileTypesRef.current;

    if (!dataTransfer.items || dataTransfer.items.length === 0) return false;

    const allFiles = Array.from(dataTransfer.items).every((item) => item.kind === "file");
    if (!allFiles) return false;

    if (dataTransfer.items.length > currentMaxFiles) return false;

    if (currentAcceptedTypes && currentAcceptedTypes.length > 0) {
      return Array.from(dataTransfer.items).every((item) => {
        return currentAcceptedTypes.some((acceptedType) => {
          if (acceptedType.endsWith("/*")) {
            const category = acceptedType.split("/")[0];
            return item.type.startsWith(`${category}/`);
          }
          return item.type === acceptedType;
        });
      });
    }

    return true;
  }, []);

  /**
   * Handle drag enter event
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent, record: EntityData) => {
      e.preventDefault();
      e.stopPropagation();

      if (validateFiles(e.dataTransfer) && onDragStateChangeRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        onDragStateChangeRef.current({
          rect,
          recordId: record.id as string,
        });
      }
    },
    [validateFiles]
  );

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent, record: EntityData) => {
      e.preventDefault();
      e.stopPropagation();

      if (validateFiles(e.dataTransfer)) {
        e.dataTransfer.dropEffect = "copy";
        // We re-calculate rect here in case of scrolling, but throttling might be needed if performance suffers
        // For now, updating on dragEnter is usually sufficient unless row moves while dragging
        if (onDragStateChangeRef.current) {
          // Optional: Update rect if you need to track movement
        }
      } else {
        e.dataTransfer.dropEffect = "none";
        if (onDragStateChangeRef.current) {
          onDragStateChangeRef.current(null);
        }
      }
    },
    [validateFiles]
  );

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent, record: EntityData) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent flickering: don't clear state if moving to a child element
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }

    if (onDragStateChangeRef.current) {
      onDragStateChangeRef.current(null);
    }
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent, record: EntityData) => {
      e.preventDefault();
      e.stopPropagation();

      // Clear overlay
      if (onDragStateChangeRef.current) {
        onDragStateChangeRef.current(null);
      }

      if (!validateFiles(e.dataTransfer)) {
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) {
        return;
      }

      if (onFileDropRef.current) {
        onFileDropRef.current(files, record);
      }
    },
    [validateFiles]
  );

  /**
   * Get drop zone props for a specific row
   */
  const getRowDropZoneProps = useCallback(
    (record: EntityData) => {
      return {
        onDragEnter: (e: React.DragEvent) => handleDragEnter(e, record),
        onDragOver: (e: React.DragEvent) => handleDragOver(e, record),
        onDragLeave: (e: React.DragEvent) => handleDragLeave(e, record),
        onDrop: (e: React.DragEvent) => handleDrop(e, record),
      };
    },
    [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]
  );

  return {
    getRowDropZoneProps,
  };
};
