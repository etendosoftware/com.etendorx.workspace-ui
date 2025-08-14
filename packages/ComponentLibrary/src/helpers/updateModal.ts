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

import { Container } from "../components/enums";
import { calculateTransform } from "../utils/transformUtil";
import { calculateTop, calculateLeft } from "./caltulatePositions";

interface ModalStyleProps {
  height: string | number;
  width: string | number;
  posX: string | number;
  posY: string | number;
}

export const calculateModalStyles = ({ height, width, posX, posY }: ModalStyleProps) => {
  return {
    height: height === Container.Auto ? "auto" : `${height}px`,
    width: width === Container.Auto ? "auto" : `${width}px`,
    top: calculateTop(posY),
    left: calculateLeft(posX),
    transform: calculateTransform(posX, posY),
  };
};
