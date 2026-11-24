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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";

/**
 * Characteristics tree used by the tests of the Product Characteristics filter, in the order the
 * server sends it (not alphabetical). Envase has a group (Botella) with an inner group (Retornable).
 */
export const CHARACTERISTIC_IDS = { ENVASE: "C_ENV", FORMATO: "C_FOR", CERTIFICACION: "C_CER" } as const;

export const VALUE_IDS = {
  BOTELLA: "G_BOT",
  VIDRIO: "L_VID",
  PET: "L_PET",
  RETORNABLE: "G_RET",
  VIDRIO_RETORNABLE: "L_VRT",
  LATA: "L_LAT",
  ML_330: "L_330",
  ML_500: "L_500",
  LITRE: "L_1L",
  VEGANO: "L_VEG",
  BIO: "L_BIO",
  SIN_AZUCAR: "L_SIN",
} as const;

const characteristicNode = (id: string, label: string): FilterOption => ({
  id,
  label,
  value: label,
  isCharacteristic: true,
});

const valueNode = (id: string, label: string, parentId: string, characteristic: string, name: string) => ({
  id,
  label,
  value: label,
  parentId,
  characteristic,
  characteristicName: name,
});

const envase = (id: string, label: string, parentId: string = CHARACTERISTIC_IDS.ENVASE) =>
  valueNode(id, label, parentId, CHARACTERISTIC_IDS.ENVASE, "Envase");
const formato = (id: string, label: string) =>
  valueNode(id, label, CHARACTERISTIC_IDS.FORMATO, CHARACTERISTIC_IDS.FORMATO, "Formato");
const certificacion = (id: string, label: string) =>
  valueNode(id, label, CHARACTERISTIC_IDS.CERTIFICACION, CHARACTERISTIC_IDS.CERTIFICACION, "Certificación");

export const buildCharacteristicsTreeOptions = (): FilterOption[] => [
  characteristicNode(CHARACTERISTIC_IDS.ENVASE, "Envase"),
  envase(VALUE_IDS.BOTELLA, "Botella"),
  envase(VALUE_IDS.VIDRIO, "Vidrio", VALUE_IDS.BOTELLA),
  envase(VALUE_IDS.PET, "PET", VALUE_IDS.BOTELLA),
  envase(VALUE_IDS.RETORNABLE, "Retornable", VALUE_IDS.BOTELLA),
  envase(VALUE_IDS.VIDRIO_RETORNABLE, "Vidrio retornable", VALUE_IDS.RETORNABLE),
  envase(VALUE_IDS.LATA, "Lata"),
  characteristicNode(CHARACTERISTIC_IDS.FORMATO, "Formato"),
  formato(VALUE_IDS.ML_330, "330 ml"),
  formato(VALUE_IDS.ML_500, "500 ml"),
  formato(VALUE_IDS.LITRE, "1 L"),
  characteristicNode(CHARACTERISTIC_IDS.CERTIFICACION, "Certificación"),
  certificacion(VALUE_IDS.VEGANO, "Vegano"),
  certificacion(VALUE_IDS.BIO, "Bio"),
  certificacion(VALUE_IDS.SIN_AZUCAR, "Sin azúcar"),
];

/** Returns the options of the given ids, in the order of the ids. */
export const pickOptions = (ids: string[]): FilterOption[] => {
  const options = buildCharacteristicsTreeOptions();
  return ids.map((id) => options.find((option) => option.id === id) as FilterOption);
};
