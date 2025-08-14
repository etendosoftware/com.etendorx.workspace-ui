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

import type en from "./en";
import type es from "./es";

type Primitive = string;

export type NestedKeyOf<T> = T extends Primitive
  ? T
  : {
      [K in keyof T & (string | number)]: T[K] extends Primitive ? K : K | `${K}.${NestedKeyOf<T[K]>}`;
    }[keyof T & (string | number)];

export type TranslationKeys = NestedKeyOf<typeof en | typeof es>;

export type Language = "en_US" | "es_ES";

export type Translations = {
  [key in Language]: typeof en | typeof es;
};
