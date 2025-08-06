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

import React from "react";
import MenuItem from "@mui/material/MenuItem";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ToggleChip from "../Toggle/ToggleChip";
import { useStyle } from "./styles";
import type { SortableItemProps } from "./DragModal.types";
import type { SxProps, Theme } from "@mui/material/styles";

const SortableItem: React.FC<SortableItemProps> = ({ id, person, item, onToggle, icon }) => {
  const currentItem = item || person;
  const { sx, styles } = useStyle();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const menuItemSx = {
    ...sx.menuItemStyles,
    ...(isDragging ? sx.menuItemDragging : {}),
  } as SxProps<Theme>;

  return (
    <MenuItem ref={setNodeRef} style={style} sx={menuItemSx} {...attributes} {...listeners} disableRipple>
      <div style={styles.sortableItemContainer}>
        <div style={styles.sortableItemLeftContainer}>
          {React.cloneElement(icon as React.ReactElement, {
            style: styles.dragStyles,
          })}
          <span className="person-label" style={styles.sortableItemLabel} title={currentItem?.label}>
            {currentItem?.label}
          </span>
        </div>
        <ToggleChip isActive={currentItem?.isActive} onToggle={onToggle} />
      </div>
    </MenuItem>
  );
};

export default SortableItem;
