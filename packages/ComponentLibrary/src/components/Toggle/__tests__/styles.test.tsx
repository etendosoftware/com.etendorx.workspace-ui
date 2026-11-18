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
import { darkTheme, theme } from "../../../theme";
import { useStyle } from "../styles";

let mockTheme: unknown = theme;

jest.mock("@mui/material", () => ({
  ...jest.requireActual("@mui/material"),
  useTheme: () => mockTheme,
}));

type Rules = Record<string, Record<string, Record<string, Record<string, unknown>>>>;

/** Switch rules built with the given theme. */
const switchRules = (activeTheme: typeof theme) => {
  mockTheme = activeTheme;
  const { result } = renderHook(() => useStyle());
  return result.current.sx.switch as unknown as Rules;
};

describe("Toggle styles", () => {
  it.each([
    ["light", theme],
    ["dark", darkTheme],
  ])("uses the accent for the on track and a contrast-safe off track in %s mode", (_mode, activeTheme) => {
    const rules = switchRules(activeTheme);

    expect(rules["& .MuiSwitch-switchBase"]["&.Mui-checked"]["& + .MuiSwitch-track"].backgroundColor).toBe(
      activeTheme.palette.dynamicColor.main
    );
    expect((rules["& .MuiSwitch-track"] as unknown as Record<string, unknown>).backgroundColor).toBe(
      activeTheme.palette.baselineColor.neutral[50]
    );
  });
});
