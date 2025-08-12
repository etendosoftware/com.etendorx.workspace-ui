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
