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

import { Position } from "../components/enums";

export const calculateTop = (posY: string | number): number | string => {
  if (posY === Position.Center) return "50%";
  if (posY === Position.Bottom) return "65%";
  if (posY === Position.Top) return "5%";
  return posY;
};

export const calculateLeft = (posX: string | number): number | string => {
  if (posX === Position.Center) return "50%";
  if (posX === Position.Left) return "5%";
  if (posX === Position.Right) return "75%";
  return posX;
};
