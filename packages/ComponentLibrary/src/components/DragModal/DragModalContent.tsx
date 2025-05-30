import { useCallback } from "react";
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
  onBack,
  backButtonText,
  activateAllText,
  deactivateAllText,
  buttonText,
}) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  );
  const theme = useTheme();
  const { styles, sx } = useStyle();

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setPeople((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    },
    [setPeople],
  );

  const handleToggleAll = useCallback(() => {
    const allActivated = people.every((person) => person.isActive);
    setPeople((prev) => prev.map((person) => ({ ...person, isActive: !allActivated })));
  }, [people, setPeople]);

  const handleToggle = useCallback(
    (id: UniqueIdentifier) => {
      setPeople((prev) =>
        prev.map((person) => (person.id === id ? { ...person, isActive: !person.isActive } : person)),
      );
    },
    [setPeople],
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
          {people.every((person) => person.isActive) ? deactivateAllText : activateAllText}
        </Link>
      </div>
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement, restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}>
          <SortableContext items={people.map((person) => person.id)} strategy={verticalListSortingStrategy}>
            <List>
              {people.map((person) => (
                <SortableItem
                  key={person.id}
                  id={person.id}
                  person={person}
                  icon={<DragIndicator fill={theme.palette.baselineColor.neutral[60]} />}
                  onToggle={() => handleToggle(person.id)}
                  isActive={person.isActive}
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
