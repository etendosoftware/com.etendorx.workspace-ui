import { UniqueIdentifier } from '@dnd-kit/core';

export interface Person {
  id: UniqueIdentifier;
  label: string;
}

export interface SortableItemProps {
  id: UniqueIdentifier;
  person: Person;
}

