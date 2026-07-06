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

import { calculateModalStyles } from "../updateModal";
import { Container, Position } from "../../components/enums";

describe("updateModal", () => {
  describe("calculateModalStyles", () => {
    it("should return auto height/width when Container.Auto is provided", () => {
      const styles = calculateModalStyles({
        height: Container.Auto,
        width: Container.Auto,
        posX: 100,
        posY: 200,
      });

      expect(styles.height).toBe("auto");
      expect(styles.width).toBe("auto");
    });

    it("should append px to numeric height/width", () => {
      const styles = calculateModalStyles({
        height: 480,
        width: 640,
        posX: 0,
        posY: 0,
      });

      expect(styles.height).toBe("480px");
      expect(styles.width).toBe("640px");
    });

    it("should resolve named positions to percentage top/left", () => {
      const styles = calculateModalStyles({
        height: 100,
        width: 100,
        posX: Position.Center,
        posY: Position.Center,
      });

      expect(styles.top).toBe("50%");
      expect(styles.left).toBe("50%");
    });

    it("should apply the centering transform only when both axes are centered", () => {
      const centered = calculateModalStyles({
        height: 100,
        width: 100,
        posX: Position.Center,
        posY: Position.Center,
      });
      expect(centered.transform).toBe("translate(-50%, -50%)");

      const offCenter = calculateModalStyles({
        height: 100,
        width: 100,
        posX: Position.Left,
        posY: Position.Center,
      });
      expect(offCenter.transform).toBe("none");
    });

    it("should pass through custom numeric positions untouched", () => {
      const styles = calculateModalStyles({
        height: 100,
        width: 100,
        posX: 250,
        posY: 300,
      });

      expect(styles.top).toBe(300);
      expect(styles.left).toBe(250);
      expect(styles.transform).toBe("none");
    });

    it("should combine string dimensions and named positions consistently", () => {
      const styles = calculateModalStyles({
        height: "50",
        width: "75",
        posX: Position.Right,
        posY: Position.Top,
      });

      expect(styles).toEqual({
        height: "50px",
        width: "75px",
        top: "5%",
        left: "75%",
        transform: "none",
      });
    });
  });
});
