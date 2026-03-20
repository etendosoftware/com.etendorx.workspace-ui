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

require("../../jest.setup.js");
require("@testing-library/jest-dom");

jest.mock("@mui/material/styles", () => {
  function makeColorScale() {
    return new Proxy({}, { get: (_target, key) => `#${String(key).padStart(6, "0")}` });
  }
  const colorScale = makeColorScale();
  return {
    ...jest.requireActual("@mui/material/styles"),
    useTheme: () => ({
      palette: {
        primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0", contrastText: "#fff" },
        secondary: { main: "#dc004e", light: "#ff5983", dark: "#9a0036", contrastText: "#fff" },
        error: { main: "#f44336", light: "#e57373", dark: "#d32f2f", contrastText: "#fff" },
        warning: { main: "#ff9800", light: "#ffb74d", dark: "#f57c00", contrastText: "rgba(0,0,0,0.87)" },
        info: { main: "#2196f3", light: "#64b5f6", dark: "#1976d2", contrastText: "#fff" },
        success: { main: "#4caf50", light: "#81c784", dark: "#388e3c", contrastText: "rgba(0,0,0,0.87)" },
        text: { primary: "rgba(0,0,0,0.87)", secondary: "rgba(0,0,0,0.6)", disabled: "rgba(0,0,0,0.38)" },
        background: { paper: "#fff", default: "#fafafa" },
        divider: "rgba(0,0,0,0.12)",
        action: { active: "rgba(0,0,0,0.54)", hover: "rgba(0,0,0,0.04)" },
        dynamicColor: { main: "#1976d2", contrastText: "#ffffff", light: "#42a5f5", dark: "#1565c0" },
        baselineColor: {
          neutral: colorScale,
          transparentNeutral: colorScale,
        },
        specificColor: {
          warning: { light: "#fff3e0", main: "#ff9800", dark: "#e65100" },
          error: { light: "#ffebee", main: "#f44336", dark: "#b71c1c" },
          success: { light: "#e8f5e9", main: "#4caf50", dark: "#1b5e20" },
        },
      },
      spacing: (factor) => `${8 * factor}px`,
      breakpoints: {
        up: () => "@media (min-width: 0px)",
        down: () => "@media (max-width: 0px)",
      },
    }),
  };
});
