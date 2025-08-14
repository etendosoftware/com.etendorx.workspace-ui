import { render } from "@testing-library/react";

// Mocks for hooks used by TabsContainer so we can hit the skeleton branch
jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ activeLevels: [], clearAllStates: jest.fn() }),
}));

jest.mock("@/hooks/navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: () => ({ activeWindow: null }),
}));

jest.mock("@/hooks/useMetadataContext", () => ({
  useMetadataContext: () => ({ getWindowMetadata: jest.fn() }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

// Mock heavy components to avoid importing server-only modules
jest.mock("@/components/window/Tabs", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/Breadcrums", () => ({
  __esModule: true,
  default: () => null,
}));

import TabsContainer from "./TabsContainer";

describe("TabsContainer - skeleton when no windowData", () => {
  it("renders loading skeleton when no windowData is available", () => {
    const { container } = render(<TabsContainer />);
    // Find the container with skeleton animation class
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });
});
