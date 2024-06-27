import { UniqueIdentifier } from '@dnd-kit/core';

export interface Person {
  id: UniqueIdentifier;
  label: string;
  isActive: boolean;
}

export interface SortableItemProps {
  id: UniqueIdentifier;
  person: Person;
  icon: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
}

export interface DragModalProps {
  initialPeople: Person[];
  onBack: () => void;
  backButtonText?: string;
  activateAllText?: string;
  deactivateAllText?: string;
}
