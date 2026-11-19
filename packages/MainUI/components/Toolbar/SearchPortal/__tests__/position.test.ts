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

import { computeSearchBoxPosition, SEARCH_BOX_GAP } from "../position";

describe("computeSearchBoxPosition", () => {
  it("opens right under the toolbar row, aligned with its right edge", () => {
    expect(computeSearchBoxPosition({ bottom: 140, right: 1424 }, 1440)).toEqual({
      top: 140 + SEARCH_BOX_GAP,
      right: 16,
    });
  });

  it("never places the box past the right edge of the viewport", () => {
    expect(computeSearchBoxPosition({ bottom: 140, right: 1500 }, 1440).right).toBe(0);
  });
});
