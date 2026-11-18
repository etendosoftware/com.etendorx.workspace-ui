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

import { renderHook } from "@testing-library/react";
import { useStyle } from "../styles";

describe("DragModal styles", () => {
  it("lets a column name use the free width of the row before cutting it", () => {
    const { result } = renderHook(() => useStyle());
    const label = result.current.styles.sortableItemLabel;

    expect(label.maxWidth).toBeUndefined();
    expect(label).toMatchObject({ flex: 1, minWidth: 0, textOverflow: "ellipsis", marginRight: "0.5rem" });
  });
});
