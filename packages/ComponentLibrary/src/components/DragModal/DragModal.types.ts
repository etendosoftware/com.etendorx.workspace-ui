import { UniqueIdentifier } from '@dnd-kit/core';
import { ReactNode } from 'react';

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
  buttonText?: string;
  icon?: string | ReactNode;
}
