import { UniqueIdentifier } from '@dnd-kit/core';
import { Person } from '../DragModal/DragModal.types';

export interface WaterfallModalProps {
  people: Person[];
  onBack: () => void;
  onToggleAll: () => void;
  onToggle: (id: UniqueIdentifier) => void;
  setPeople: (people: Person[]) => void;
}
