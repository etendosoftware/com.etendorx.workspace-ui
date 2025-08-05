require("../../jest.setup.js");
require("@testing-library/jest-dom");

jest.mock("@mui/material/styles", () => ({
  ...jest.requireActual("@mui/material/styles"),
  useTheme: () => ({
    palette: {
      primary: { main: "#1976d2" },
      secondary: { main: "#dc004e" },
    },
    spacing: (factor) => `${8 * factor}px`,
    breakpoints: {
      up: () => "@media (min-width: 0px)",
      down: () => "@media (max-width: 0px)",
    },
  }),
}));
