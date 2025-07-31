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
  people,
  setPeople,
  items,
  setItems,
  onBack,
  backButtonText,
  activateAllText,
  deactivateAllText,
  buttonText,
}) => {
  // Use useMemo to prevent dependency changes on every render
  const currentItems = useMemo(() => items || people || [], [items, people]);
  const setCurrentItems = useMemo(() => setItems || setPeople || (() => {}), [setItems, setPeople]);

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
