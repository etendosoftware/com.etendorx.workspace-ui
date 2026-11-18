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

import { renderHook } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import type React from "react";
import { FILTER_FIELD_FOCUS_SX, FILTER_FIELD_HOVER_SX, FILTER_FIELD_SX, useStyle } from "../styles";

describe("grid filter fields", () => {
  it("draws every column filter as a filled field with hover and focus outlines", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    );
    const { result } = renderHook(() => useStyle(), { wrapper });
    const headCell = result.current.sx.tableHeadCell as Record<string, unknown>;

    expect(headCell["& .h-10"]).toBe(FILTER_FIELD_SX);
    expect(headCell["& .h-10:hover"]).toBe(FILTER_FIELD_HOVER_SX);
    expect(headCell["& .h-10:focus-within"]).toBe(FILTER_FIELD_FOCUS_SX);
    expect(FILTER_FIELD_SX.backgroundColor).toBe("var(--ui-search-bg)");
  });
});
