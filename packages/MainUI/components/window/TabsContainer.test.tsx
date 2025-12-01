import { render } from "@testing-library/react";
import TabsContainer from "./TabsContainer";
import WindowProvider from "@/contexts/window";

// Mocks for hooks used by TabsContainer so we can hit the skeleton branch
jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({
    activeLevels: [],
    clearAllStates: jest.fn(),
    graph: {
      clearSelected: jest.fn(),
      clearSelectedMultiple: jest.fn(),
    },
  }),
}));

jest.mock("@/hooks/useMetadataContext", () => ({
  useMetadataContext: () => ({ getWindowMetadata: jest.fn() }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}));

jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    activeLevels: [],
    activeTabsByLevel: new Map(),
    setActiveLevel: jest.fn(),
    setActiveTabsByLevel: jest.fn(),
  }),
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

describe("TabsContainer - skeleton when no windowData", () => {
  it("renders loading skeleton when no windowData is available", () => {
    const { container } = render(
      <WindowProvider>
        <TabsContainer windowData={undefined as any} />
      </WindowProvider>
    );
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });
});
