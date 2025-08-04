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

export function rgbaToHex(rgba: string): string {
  if (rgba.startsWith("#")) {
    return rgba.toUpperCase();
  }

  const parts = rgba.substring(rgba.indexOf("(")).split(",");
  const r = Number.parseInt(parts[0].substring(1).trim(), 10);
  const g = Number.parseInt(parts[1].trim(), 10);
  const b = Number.parseInt(parts[2].trim(), 10);
  const a = Number.parseFloat(parts[3] || "1");

  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

  if (a === 1) {
    return hex;
  }

  const alpha = Math.round(a * 255)
    .toString(16)
    .toUpperCase();
  return hex + (alpha.length === 1 ? `0${alpha}` : alpha);
}
