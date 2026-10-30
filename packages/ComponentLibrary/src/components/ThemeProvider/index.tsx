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

"use client";

import { ThemeProvider as MUIThemeProvider, CssBaseline } from "@mui/material";
import { useEffect } from "react";
import { darkTheme, theme } from "../../theme";
import { applyThemeMode, useThemeMode } from "../../theme/mode";

export default function ThemeProvider({ children }: React.PropsWithChildren) {
  const mode = useThemeMode();

  // The root layout sets this before first paint; keep the attribute in sync afterwards.
  useEffect(() => {
    applyThemeMode(mode);
  }, [mode]);

  return (
    <MUIThemeProvider theme={mode === "dark" ? darkTheme : theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
