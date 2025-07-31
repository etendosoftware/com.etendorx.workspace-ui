import type { UniqueIdentifier } from "@dnd-kit/core";
import type { ToggleableItem, Item } from "../DragModal/DragModal.types";
import type { ReactNode } from "react";

export interface WaterfallModalProps<T extends ToggleableItem = Item> {
  menuItems: { emoji: string; label: string; key: string }[];
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  onBack?: () => void;
  onToggleAll?: () => void;
  onToggle?: (id: UniqueIdentifier) => void;
  backButtonText?: string;
  activateAllText?: string;
  deactivateAllText?: string;
  customizeText?: string;
  buttonText?: string;
  tooltipWaterfallButton?: string;
  icon?: string | ReactNode;
}
