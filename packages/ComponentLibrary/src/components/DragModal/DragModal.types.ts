import type { UniqueIdentifier } from "@dnd-kit/core";
import type { ReactNode } from "react";

export interface ToggleableItem {
  id: UniqueIdentifier;
  label: string;
  isActive: boolean;
}

export interface Item extends ToggleableItem {}

export interface SortableItemProps<T extends ToggleableItem = Item> {
  id: UniqueIdentifier;
  item?: T;
  person?: T;
  icon: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
}

export interface SortableItemPropsLegacy extends SortableItemProps<Item> {
  person: Item;
}

export interface DragModalProps<T extends ToggleableItem = Item> {
  initialItems: T[];
  onBack?: () => void;
  onClose: () => void;
  backButtonText?: string;
  activateAllText?: string;
  deactivateAllText?: string;
  buttonText?: string;
  icon?: string | ReactNode;
}

export interface DragModalContentProps<T extends ToggleableItem = Item> {
  items?: T[];
  setItems?: React.Dispatch<React.SetStateAction<T[]>>;
  people?: T[];
  setPeople?: React.Dispatch<React.SetStateAction<T[]>>;
  onBack?: () => void;
  backButtonText?: string;
  activateAllText?: string;
  deactivateAllText?: string;
  buttonText?: string;
}
