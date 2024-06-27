import { UniqueIdentifier } from '@dnd-kit/core';
import { Person } from '../DragModal/DragModal.types';

export interface WaterfallModalProps {
  menuItems: { emoji: string; label: string; key: string }[];
  people: Person[];
  initialPeople: Person[];
  onBack: () => void;
  onToggleAll: () => void;
  onToggle: (id: UniqueIdentifier) => void;
  setPeople: (people: Person[]) => void;
  backButtonText?: string;
  activateAllText?: string;
  deactivateAllText?: string;
  customizeText?: string;
  buttonText?: string;
}
