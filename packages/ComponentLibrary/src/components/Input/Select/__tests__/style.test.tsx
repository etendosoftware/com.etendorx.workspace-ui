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
import { useStyle } from "../style";

/** Theme whose every palette entry resolves to a colour, so the style can be built without the full theme. */
const anyColorTheme = (): unknown =>
  new Proxy(() => "#000000", {
    get: (_target, key) => (key === Symbol.toPrimitive ? () => "#000000" : anyColorTheme()),
  });

jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  useTheme: () => anyColorTheme(),
}));

describe("Select style", () => {
  it("shows a disabled select without a fill, like the read-only form fields", () => {
    const { result } = renderHook(() => useStyle());
    const inputRules = (result.current.sx.root as unknown as Record<string, Record<string, Record<string, unknown>>>)[
      "& .MuiInput-root"
    ];

    expect(inputRules["&.Mui-disabled"].backgroundColor).toBe("transparent");
  });
});
