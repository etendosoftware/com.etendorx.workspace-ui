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

import { useCallback, useMemo } from "react";
import List from "@mui/material/List";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import type { DragModalContentProps } from "./DragModal.types";
import ModalDivider from "../ModalDivider";
import DragIndicator from "../../assets/icons/drag.svg";
import NavigateBefore from "../../assets/icons/chevron-left.svg";
import { useStyle } from "./styles";
import { Box, Button, Link, useTheme } from "@mui/material";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";

const DragModalContent: React.FC<DragModalContentProps> = ({
  items,
  setItems,
  onBack,
  backButtonText,
  activateAllText,
  deactivateAllText,
  buttonText,
}) => {
  const currentItems = useMemo(() => items ?? [], [items]);
  const setCurrentItems = useMemo(() => setItems ?? (() => {}), [setItems]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );
  const theme = useTheme();
  const { styles, sx } = useStyle();

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setCurrentItems((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    },
    [setCurrentItems]
  );

  const handleToggleAll = useCallback(() => {
    const allActivated = currentItems.every((item) => item.isActive);
    setCurrentItems((prev) => prev.map((item) => ({ ...item, isActive: !allActivated })));
  }, [currentItems, setCurrentItems]);

  const handleToggle = useCallback(
    (id: UniqueIdentifier) => {
      setCurrentItems((prev) => prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item)));
    },
    [setCurrentItems]
  );
  return (
    <>
      <div style={styles.sectionContainer}>
        <Box sx={sx.headerBox}>
          <Button
            onClick={onBack}
            startIcon={<NavigateBefore fill={theme.palette.baselineColor.neutral[60]} style={styles.StartIconStyles} />}
            style={styles.CustomizeButton}
            sx={sx.customizeButton}>
            {backButtonText}
          </Button>
        </Box>
      </div>
      <ModalDivider />
      <div style={styles.containerStyles}>
        <p>{buttonText}</p>
        <Link sx={sx.linkStyles} onClick={handleToggleAll}>
          {currentItems.every((item) => item.isActive) ? deactivateAllText : activateAllText}
        </Link>
      </div>
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement, restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}>
          <SortableContext items={currentItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <List>
              {currentItems.map((item) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  item={item}
                  icon={<DragIndicator fill={theme.palette.baselineColor.neutral[60]} />}
                  onToggle={() => handleToggle(item.id)}
                  isActive={item.isActive}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
};

export default DragModalContent;
