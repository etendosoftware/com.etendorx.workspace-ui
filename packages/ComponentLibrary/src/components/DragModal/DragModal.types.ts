/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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
  onBack?: () => void;
  backButtonText?: string;
  activateAllText?: string;
  deactivateAllText?: string;
  buttonText?: string;
}
