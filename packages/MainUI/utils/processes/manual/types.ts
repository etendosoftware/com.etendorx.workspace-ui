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

export interface GetParamsProps {
  currentButtonId: string;
  record: Record<string, unknown>;
  recordId: string;
  windowId: string;
  tabId: string;
  tableId: string;
  token: string | null;
  isPostedProcess: boolean;
}

export type TransformableValue = string | number | boolean | null | undefined | NestedObject | SelectionItem[];

type KeyMapping = {
  target: string;
  default: string | number | boolean | null;
};

// Tipo para el mapa de claves

// Tipo para valores primitivos que pueden estar en los objetos
export type PrimitiveValue = string | number | boolean | null | undefined;

// Tipo para objetos anidados con _selection
export type SelectionItem = Record<string, unknown> & {
  amount?: number;
};

export type NestedObject = {
  [key: string]: unknown;
  _selection?: SelectionItem[];
  actual_payment?: number;
};

export type KeyMapConfig = Record<string, KeyMapping>;

// Tipo para el objeto fuente (entrada)
export type SourceObject = Record<string, PrimitiveValue | NestedObject>;

// Tipo para el objeto objetivo (salida)
export type TargetObject = Record<string, PrimitiveValue | NestedObject | SelectionItem[]>;
