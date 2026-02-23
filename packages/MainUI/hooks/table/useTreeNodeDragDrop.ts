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

import { useCallback, useRef, useState } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { datasource } from "@workspaceui/api-client/src/api/datasource";

/**
 * Custom data transfer type used to identify tree node drag events,
 * distinguishing them from file drag-and-drop operations.
 */
export const TREE_DRAG_TYPE = "application/x-etendo-tree-node";

/**
 * Where the dragged node will land relative to the target row:
 * - "before" – inserted as a sibling immediately above the target row
 * - "on"     – reparented as the last child of the target row
 * - "after"  – inserted as a sibling immediately below the target row
 */
export type DropPosition = "before" | "on" | "after";

/** Active drop target with its resolved insertion position. */
export interface DropTarget {
  id: string;
  position: DropPosition;
}

interface UseTreeNodeDragDropOptions {
  /** Whether tree mode is currently active */
  shouldUseTreeMode: boolean;
  /** The datasource entity ID used for tree API requests */
  treeEntity: string;
  /** The referenced table ID for tree operations */
  referencedTableId?: string;
  /** The tab ID for tree operations */
  tabId: string;
  /** All currently displayed (flattened) tree records, used for hierarchy validation */
  displayRecords: EntityData[];
  /** Function to refetch tree data after a successful node move */
  refetch: () => Promise<void>;
  /** Callback invoked when a move operation fails or is rejected */
  onError: (message: string) => void;
  /** Optional callback invoked after a successful move */
  onSuccess?: () => void;
  /** The parent tab record ID (for child tabs), or null for root tabs */
  parentTabRecordId?: string | null;
}

/**
 * Reads the mouse position within the hovered row and maps it to a DropPosition:
 * - Top 30 %  → "before"  (insertion line above the row)
 * - Middle 40 % → "on"    (reparent: make child of row)
 * - Bottom 30 % → "after" (insertion line below the row)
 */
function resolveDropPosition(e: React.DragEvent, targetRecord?: EntityData): DropPosition {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;

  // If target cannot be a parent node, only allow "before" (top 50%) or "after" (bottom 50%)
  const canBeParent = targetRecord
    ? targetRecord.canBeParentNode !== false && targetRecord.showDropIcon !== false
    : true;

  if (!canBeParent) {
    return ratio < 0.5 ? "before" : "after";
  }

  if (ratio < 0.3) return "before";
  if (ratio > 0.7) return "after";
  return "on";
}

type ResolvedDrop = {
  newParentId: string;
  dropIndex: number;
  prevNodeId: string | null;
  nextNodeId: string | null;
  prevIndex: number;
};

/**
 * Calculates drop coordinates (parent, sibling order) based on DropPosition in the tree hierarchy.
 */
function buildDropDetails(
  draggingId: string,
  targetId: string,
  position: DropPosition,
  originalParentId: string,
  effectiveTargetParentId: string,
  displayRecords: EntityData[]
): ResolvedDrop {
  const originalSiblings = displayRecords.filter((r) => String(r.parentId ?? "-1") === originalParentId);
  const prevIndex = Math.max(
    originalSiblings.findIndex((r) => String(r.id) === draggingId),
    0
  );

  let newParentId: string;
  let dropIndex: number;
  let prevNodeId: string | null = null;
  let nextNodeId: string | null = null;

  if (position === "on") {
    const targetChildren = displayRecords.filter((r) => String(r.parentId ?? "-1") === targetId);
    newParentId = targetId;
    dropIndex = targetChildren.length;
    if (targetChildren.length > 0) {
      prevNodeId = String(targetChildren[targetChildren.length - 1].id);
    }
  } else {
    const siblings = displayRecords.filter((r) => String(r.parentId ?? "-1") === effectiveTargetParentId);
    const targetSiblingIndex = siblings.findIndex((r) => String(r.id) === targetId);
    newParentId = effectiveTargetParentId;

    if (position === "before") {
      dropIndex = targetSiblingIndex;
      nextNodeId = targetId;
      if (targetSiblingIndex > 0) {
        prevNodeId = String(siblings[targetSiblingIndex - 1].id);
      }
    } else {
      dropIndex = targetSiblingIndex + 1;
      prevNodeId = targetId;
      if (targetSiblingIndex < siblings.length - 1) {
        nextNodeId = String(siblings[targetSiblingIndex + 1].id);
      }
    }
  }

  return { newParentId, dropIndex, prevNodeId, nextNodeId, prevIndex };
}

/**
 * Analyzes the API response to find any explicitly thrown errors or reverted states.
 */
// biome-ignore lint/suspicious/noExplicitAny: response shape is dynamic
function processDropResponse(erpResponse: any): string | null {
  if (erpResponse?.status === -1 || erpResponse?.message?.messageType === "error") {
    return erpResponse?.message?.message ?? erpResponse?.error?.message ?? "Failed to move tree node";
  }

  const nodes: EntityData[] = erpResponse?.data ?? [];
  // biome-ignore lint/suspicious/noExplicitAny: node shape is dynamic
  const hasRevert = nodes.some((n: any) => n.revertMovement === true);
  if (hasRevert) {
    return erpResponse?.message?.message ?? "Node move was reverted by the server";
  }

  return null;
}

/**
 * Hook that adds drag-and-drop node reordering/reparenting support to the tree view.
 *
 * Implements HTML5 native DnD to allow users to drag tree rows onto other rows,
 * triggering a backend update that persists the new hierarchy. Errors from the
 * backend (including validation errors propagated by ob-tree-view-grid.js / PR #904)
 * are surfaced via the `onError` callback.
 *
 * Three visual zones per row:
 *  - Top band    → insertion line above row  (sibling "before")
 *  - Middle band → blue overlay on row       (reparent as child – "on")
 *  - Bottom band → insertion line below row  (sibling "after")
 *
 * Distinguishes tree-node drags from file drags via the `TREE_DRAG_TYPE` data
 * transfer type, so file-attachment drop zones remain unaffected.
 */
export const useTreeNodeDragDrop = ({
  shouldUseTreeMode,
  treeEntity,
  referencedTableId,
  tabId,
  displayRecords,
  refetch,
  onError,
  onSuccess,
  parentTabRecordId = null,
}: UseTreeNodeDragDropOptions) => {
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [isTreeDragActive, setIsTreeDragActive] = useState(false);
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  const draggingRecordRef = useRef<EntityData | null>(null);

  /**
   * Returns true if the target record is a descendant of the node being dragged.
   * Prevents creating circular references in the hierarchy.
   */
  const isDescendant = useCallback(
    (targetRecord: EntityData, draggingId: string): boolean => {
      let currentParentId = String(targetRecord.parentId ?? "");
      const visited = new Set<string>();

      while (currentParentId && currentParentId !== "-1" && !visited.has(currentParentId)) {
        if (currentParentId === draggingId) return true;
        visited.add(currentParentId);
        const parent = displayRecords.find((r) => String(r.id) === currentParentId);
        if (!parent) break;
        currentParentId = String(parent.parentId ?? "");
      }
      return false;
    },
    [displayRecords]
  );

  /**
   * Returns true only if the drag event carries a tree node (not files).
   */
  const isTreeNodeDrag = useCallback((e: React.DragEvent): boolean => {
    return e.dataTransfer.types.includes(TREE_DRAG_TYPE);
  }, []);

  /**
   * Validates whether a drop at the given position onto targetRecord is legal.
   * - "on"            → target must not be self or a descendant of the dragging node
   * - "before"/"after" → effective new parent (target's parent) must not be the dragging
   *                       node or a descendant of it
   */
  const isDropAllowed = useCallback(
    (targetRecord: EntityData, draggingId: string, position: DropPosition): boolean => {
      const targetId = String(targetRecord.id);

      if (targetId === draggingId) return false;

      if (position === "on") {
        const canBeParent = targetRecord.canBeParentNode !== false && targetRecord.showDropIcon !== false;
        if (!canBeParent) return false;
        return !isDescendant(targetRecord, draggingId);
      }

      // "before" / "after": the new parent is the target's current parent
      const effectiveParentId = String(targetRecord.parentId ?? "-1");
      if (effectiveParentId === draggingId) return false;

      const parentRecord = displayRecords.find((r) => String(r.id) === effectiveParentId);
      if (parentRecord && isDescendant(parentRecord, draggingId)) return false;

      return true;
    },
    [isDescendant, displayRecords]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, record: EntityData) => {
      if (!shouldUseTreeMode) return;

      draggingRecordRef.current = record;
      e.dataTransfer.setData(TREE_DRAG_TYPE, String(record.id));
      e.dataTransfer.effectAllowed = "move";

      // Create a premium, beautiful custom drag image to avoid the messy transparent table row
      const identifier = record._identifier || "Selected Item";
      const ghostImage = document.createElement("div");

      // Glassmorphism and premium UI styling
      ghostImage.style.position = "absolute";
      ghostImage.style.top = "-1000px";
      ghostImage.style.left = "-1000px";
      ghostImage.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
      ghostImage.style.backdropFilter = "blur(12px)";
      ghostImage.style.border = "1px solid rgba(0, 74, 202, 0.2)";
      ghostImage.style.padding = "8px 16px";
      ghostImage.style.borderRadius = "8px";
      ghostImage.style.boxShadow = "0px 10px 20px rgba(0, 0, 0, 0.12), 0px 4px 8px rgba(0, 74, 202, 0.08)";
      ghostImage.style.fontFamily = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ghostImage.style.fontSize = "13px";
      ghostImage.style.color = "#0F172A"; // deep dark blue/slate
      ghostImage.style.fontWeight = "600";
      ghostImage.style.display = "flex";
      ghostImage.style.alignItems = "center";
      ghostImage.style.gap = "10px";
      ghostImage.style.zIndex = "9999";
      ghostImage.style.pointerEvents = "none";
      ghostImage.style.maxWidth = "320px";
      ghostImage.style.whiteSpace = "nowrap";

      // Insert SVG icon and text container. We use textContent for safety on the span.
      ghostImage.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004aca" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="12" r="1.5"></circle>
          <circle cx="9" cy="5" r="1.5"></circle>
          <circle cx="9" cy="19" r="1.5"></circle>
          <circle cx="15" cy="12" r="1.5"></circle>
          <circle cx="15" cy="5" r="1.5"></circle>
          <circle cx="15" cy="19" r="1.5"></circle>
        </svg>
        <span class="ghost-text" style="overflow: hidden; text-overflow: ellipsis; display: inline-block;"></span>
      `;
      const textSpan = ghostImage.querySelector(".ghost-text");
      if (textSpan) textSpan.textContent = String(identifier);

      document.body.appendChild(ghostImage);
      // Set the custom image as the drag ghost, offset slightly to rest nicely under the mouse
      e.dataTransfer.setDragImage(ghostImage, 15, 15);

      // Clean up the ghost DOM element immediately after the drag starts
      setTimeout(() => {
        if (document.body.contains(ghostImage)) {
          document.body.removeChild(ghostImage);
        }
      }, 0);

      // Track the dragging row via React state so the className is React-managed.
      // Now that we have a custom drag image, this state mutation will just grey out
      // the original row in the table, rather than creating a messy ghost image.
      setDraggingRowId(String(record.id));
      setIsTreeDragActive(true);
    },
    [shouldUseTreeMode]
  );

  const handleDragEnd = useCallback((_e: React.DragEvent) => {
    draggingRecordRef.current = null;
    setDraggingRowId(null);
    setDropTarget(null);
    setIsTreeDragActive(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, record: EntityData) => {
      if (!shouldUseTreeMode || !isTreeNodeDrag(e)) return;

      const dragging = draggingRecordRef.current;
      if (!dragging) return;

      const draggingId = String(dragging.id);
      const position = resolveDropPosition(e, record);

      if (!isDropAllowed(record, draggingId, position)) {
        e.dataTransfer.dropEffect = "none";
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";
      setDropTarget({ id: String(record.id), position });
    },
    [shouldUseTreeMode, isTreeNodeDrag, isDropAllowed]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent, record: EntityData) => {
      if (!shouldUseTreeMode || !isTreeNodeDrag(e)) return;

      // Prevent flickering when moving over child elements of the same row
      if (e.relatedTarget && (e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
        return;
      }

      if (dropTarget?.id === String(record.id)) {
        setDropTarget(null);
      }
    },
    [shouldUseTreeMode, isTreeNodeDrag, dropTarget]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetRecord: EntityData) => {
      if (!shouldUseTreeMode || !isTreeNodeDrag(e)) return;

      e.preventDefault();
      e.stopPropagation();

      const dragging = draggingRecordRef.current;
      draggingRecordRef.current = null;
      setDropTarget(null);
      setIsTreeDragActive(false);

      if (!dragging) return;

      const targetId = String(targetRecord.id);
      const draggingId = String(dragging.id);
      const position = resolveDropPosition(e, targetRecord);

      // Final validation
      if (!isDropAllowed(targetRecord, draggingId, position)) return;

      try {
        const originalParentId = String(dragging.parentId ?? "-1");
        const effectiveTargetParentId = String(targetRecord.parentId ?? "-1");

        const details = buildDropDetails(
          draggingId,
          targetId,
          position,
          originalParentId,
          effectiveTargetParentId,
          displayRecords
        );

        // Build the updated record with the resolved parentId
        const updatedData = {
          ...dragging,
          parentId: details.newParentId,
          prevIndex: details.prevIndex,
        };

        const payload = {
          operationType: "update",
          data: updatedData,
          oldValues: { ...dragging },
        };

        const queryParams = new URLSearchParams({
          _operationType: "update",
          _startRow: "0",
          _endRow: "200",
          _noActiveFilter: "true",
          tabId,
          parentRecordId: String(parentTabRecordId ?? "null"),
          dropIndex: String(details.dropIndex),
        });

        if (referencedTableId) {
          queryParams.set("referencedTableId", referencedTableId);
        }
        if (details.prevNodeId) {
          queryParams.set("prevNodeId", details.prevNodeId);
        }
        if (details.nextNodeId) {
          queryParams.set("nextNodeId", details.nextNodeId);
        }

        // biome-ignore lint/suspicious/noExplicitAny: datasource client returns dynamic response
        const response = (await datasource.client.request(`api/datasource/${treeEntity}?${queryParams.toString()}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })) as any;

        const erpResponse = (response?.data)?.response;
        const errorMessage = processDropResponse(erpResponse);

        if (errorMessage) {
          onError(errorMessage);
          return;
        }

        // Success: refresh tree to reflect the persisted changes
        await refetch();
        onSuccess?.();
      } catch (err) {
        onError((err as Error).message ?? "Failed to move tree node");
      }
    },
    [
      shouldUseTreeMode,
      isTreeNodeDrag,
      isDropAllowed,
      displayRecords,
      treeEntity,
      referencedTableId,
      tabId,
      parentTabRecordId,
      refetch,
      onError,
      onSuccess,
    ]
  );

  /**
   * Returns drag-source props (`draggable`, `onDragStart`, `onDragEnd`) for a tree row.
   */
  const getNodeDragProps = useCallback(
    (record: EntityData) => {
      if (!shouldUseTreeMode) return {};
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => handleDragStart(e, record),
        onDragEnd: (e: React.DragEvent) => handleDragEnd(e),
      };
    },
    [shouldUseTreeMode, handleDragStart, handleDragEnd]
  );

  /**
   * Returns drop-zone props (`onDragOver`, `onDragLeave`, `onDrop`) for a tree row.
   */
  const getNodeDropProps = useCallback(
    (record: EntityData) => {
      if (!shouldUseTreeMode) return {};
      return {
        onDragOver: (e: React.DragEvent) => handleDragOver(e, record),
        onDragLeave: (e: React.DragEvent) => handleDragLeave(e, record),
        onDrop: (e: React.DragEvent) => handleDrop(e, record),
      };
    },
    [shouldUseTreeMode, handleDragOver, handleDragLeave, handleDrop]
  );

  return {
    /** Active drop target with position ("before" | "on" | "after"), or null when not dragging */
    dropTarget,
    /** ID of the row currently being dragged, or null when idle */
    draggingRowId,
    /** True while a tree node drag is in progress */
    isTreeDragActive,
    getNodeDragProps,
    getNodeDropProps,
  };
};
