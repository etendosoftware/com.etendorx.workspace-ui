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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type CSSProperties, type ReactNode, useCallback } from "react";

/** What a row needs to make part of itself the drag handle. */
export interface SortableHandleProps {
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  isDragging: boolean;
}

export interface SortableListProps<T extends { id: string }> {
  items: T[];
  /** Called with the new order when a row is dropped somewhere else. */
  onReorder: (items: T[]) => void;
  /** Renders a row. Spread `attributes` and `listeners` on the element that should start the drag. */
  renderItem: (item: T, handle: SortableHandleProps) => ReactNode;
  className?: string;
  "data-testid"?: string;
}

interface SortableRowProps<T extends { id: string }> {
  item: T;
  renderItem: SortableListProps<T>["renderItem"];
}

function SortableRow<T extends { id: string }>({ item, renderItem }: SortableRowProps<T>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, {
        attributes: attributes as unknown as Record<string, unknown>,
        listeners: listeners as Record<string, unknown> | undefined,
        setActivatorNodeRef,
        isDragging,
      })}
    </div>
  );
}

/**
 * A vertical list whose rows can be reordered by dragging, with the mouse, touch or the keyboard. It only
 * reports the new order; what a row looks like and which part of it is the handle is up to `renderItem`.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  "data-testid": testId,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) {
        return;
      }
      const from = items.findIndex((item) => item.id === active.id);
      const to = items.findIndex((item) => item.id === over.id);
      if (from >= 0 && to >= 0) {
        onReorder(arrayMove(items, from, to));
      }
    },
    [items, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      data-testid="DndContext__559aeb">
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
        data-testid="SortableContext__559aeb">
        <div className={className} data-testid={testId}>
          {items.map((item) => (
            <SortableRow key={item.id} item={item} renderItem={renderItem} data-testid="SortableRow__559aeb" />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default SortableList;
