import { render, screen } from "@testing-library/react";
import Page from "@/app/(main)/window/page";
import { useWindowStore } from "@/stores/windowStore";

// Mock dependencies
jest.mock("@/stores/windowStore", () => ({
  useWindowStore: jest.fn(),
}));

jest.mock("@/components/NavigationTabs/WindowTabs", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: any) => <div data-testid={testId}>WindowTabs</div>,
}));

jest.mock("@/screens/Home", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: any) => <div data-testid={testId}>Home</div>,
}));

jest.mock("@/components/window/Window", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: any) => <div data-testid={testId}>Window</div>,
}));

jest.mock("@/contexts/tabs", () => ({
  __esModule: true,
  default: ({ children, "data-testid": testId }: any) => <div data-testid={testId}>{children}</div>,
}));

jest.mock("@/components/loading", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: any) => <div data-testid={testId}>Loading</div>,
}));

/** Helper to set up useWindowStore mock with the given windows and recovery state */
function mockWindowStore(opts: {
  windows?: Record<string, any>;
  isRecoveryLoading?: boolean;
}) {
  const { windows = {}, isRecoveryLoading = false } = opts;
  (useWindowStore as unknown as jest.Mock).mockImplementation((selector: (s: any) => any) => {
    const state = { windows, isRecoveryLoading };
    return selector(state);
  });
}

describe("Window Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Loading when isRecoveryLoading is true and no activeWindow", () => {
    mockWindowStore({ windows: {}, isRecoveryLoading: true });

    render(<Page />);

    expect(screen.getByTestId("Loading__Recovery")).toBeInTheDocument();
  });

  it("renders Home when no activeWindow", () => {
    mockWindowStore({ windows: {}, isRecoveryLoading: false });

    render(<Page />);

    expect(screen.getByTestId("Home__351d9c")).toBeInTheDocument();
  });

  it("renders Home when isHomeRoute is true", () => {
    // isHomeRoute = !activeWindow. If no window is active, isHomeRoute = true
    // even if windows exist
    mockWindowStore({
      windows: { "123": { windowIdentifier: "123", isActive: false } },
      isRecoveryLoading: false,
    });

    render(<Page />);

    // Check for Home component
    const homeElement = screen.getByText("Home");
    expect(homeElement).toBeInTheDocument();

    // Window that was never visited is NOT mounted (keep-in-DOM only applies
    // to previously visited windows — mountedWindows starts empty)
    const windowEl = screen.queryByTestId("Window__123");
    expect(windowEl).not.toBeInTheDocument();
  });

  it("renders Window when activeWindow is present and not home route", () => {
    mockWindowStore({
      windows: { "123": { windowIdentifier: "123", isActive: true } },
      isRecoveryLoading: false,
    });

    render(<Page />);

    expect(screen.getByTestId("Window__123")).toBeInTheDocument();
  });

  it("renders WindowTabs when windows exist", () => {
    mockWindowStore({
      windows: { "123": { windowIdentifier: "123", isActive: true } },
      isRecoveryLoading: false,
    });

    render(<Page />);

    expect(screen.getByTestId("WindowTabs__123")).toBeInTheDocument();
  });

  it("does not render WindowTabs when no windows exist", () => {
    mockWindowStore({ windows: {}, isRecoveryLoading: false });

    render(<Page />);

    expect(screen.queryByText("WindowTabs")).not.toBeInTheDocument();
  });
});
