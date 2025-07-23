require("../../jest.setup.js");

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

// jest.mock("@workspaceui/componentlibrary/src/hooks/useLocalStorage", () => ({
//   __esModule: true,
//   default: (key, initialValue) => [initialValue, jest.fn()],
// }));
