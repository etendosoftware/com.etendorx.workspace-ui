import { render, screen } from "@testing-library/react";
import Page from "@/app/(main)/window/page";
import { useWindowContext } from "@/contexts/window";

// Mock dependencies
jest.mock("@/contexts/window", () => ({
  useWindowContext: jest.fn(),
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

describe("Window Page", () => {
  const mockUseWindowContext = useWindowContext as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Loading when isRecoveryLoading is true and no activeWindow", () => {
    mockUseWindowContext.mockReturnValue({
      windows: [],
      activeWindow: null,
      isHomeRoute: false,
      isRecoveryLoading: true,
    });

    render(<Page />);

    expect(screen.getByTestId("Loading__Recovery")).toBeInTheDocument();
  });

  it("renders Home when no activeWindow", () => {
    mockUseWindowContext.mockReturnValue({
      windows: [],
      activeWindow: null,
      isHomeRoute: false,
      isRecoveryLoading: false,
    });

    render(<Page />);

    expect(screen.getByTestId("Home__351d9c")).toBeInTheDocument();
  });

  it("renders Home when isHomeRoute is true", () => {
    mockUseWindowContext.mockReturnValue({
      windows: [{ windowIdentifier: "123" }],
      activeWindow: { windowIdentifier: "123" },
      isHomeRoute: true,
      isRecoveryLoading: false,
    });

    render(<Page />);

    // Check for Home component
    const homeElement = screen.getByText("Home");
    expect(homeElement).toBeInTheDocument();

    // Check that Window is NOT rendered
    expect(screen.queryByText("Window")).not.toBeInTheDocument();
  });

  it("renders Window when activeWindow is present and not home route", () => {
    mockUseWindowContext.mockReturnValue({
      windows: [{ windowIdentifier: "123" }],
      activeWindow: { windowIdentifier: "123" },
      isHomeRoute: false,
      isRecoveryLoading: false,
    });

    render(<Page />);

    expect(screen.getByTestId("Window__123")).toBeInTheDocument();
  });

  it("renders WindowTabs when windows exist", () => {
    mockUseWindowContext.mockReturnValue({
      windows: [{ windowIdentifier: "123" }],
      activeWindow: { windowIdentifier: "123" },
      isHomeRoute: false,
      isRecoveryLoading: false,
    });

    render(<Page />);

    expect(screen.getByTestId("WindowTabs__123")).toBeInTheDocument();
  });

  it("does not render WindowTabs when no windows exist", () => {
    mockUseWindowContext.mockReturnValue({
      windows: [],
      activeWindow: null,
      isHomeRoute: true,
      isRecoveryLoading: false,
    });

    render(<Page />);

    expect(screen.queryByText("WindowTabs")).not.toBeInTheDocument();
  });
});
