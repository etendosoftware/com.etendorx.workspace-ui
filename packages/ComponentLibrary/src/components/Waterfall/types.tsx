import type { UniqueIdentifier } from "@dnd-kit/core";
import type { Person } from "../DragModal/DragModal.types";
import type { ReactNode } from "react";

export interface WaterfallModalProps {
  menuItems: { emoji: string; label: string; key: string }[];
  people: Person[];
  initialPeople: Person[];
  onBack?: () => void;
  onToggleAll?: () => void;
  onToggle?: (id: UniqueIdentifier) => void;
  setPeople?: (people: Person[]) => void;
  backButtonText?: string;
  activateAllText?: string;
  deactivateAllText?: string;
  customizeText?: string;
  buttonText?: string;
  tooltipWaterfallButton?: string;
  icon?: string | ReactNode;
}
