import { UniqueIdentifier } from '@dnd-kit/core';
<<<<<<< Updated upstream

export interface Person {
  id: UniqueIdentifier;
  label: string;
}

export interface SortableItemProps {
    id: UniqueIdentifier;
    person: Person;
  }
=======
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
>>>>>>> Stashed changes
