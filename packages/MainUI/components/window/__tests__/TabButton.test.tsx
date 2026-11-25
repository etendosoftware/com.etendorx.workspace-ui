import { act, render, screen, fireEvent } from "@testing-library/react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { TabButton } from "../TabButton";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useWindowStore } from "@/stores/windowStore";
import { getTabCountKey, useTabCountsStore } from "@/stores/tabCountsStore";
import { DIRTY_TITLE_PREFIX, DIRTY_SOURCE_KINDS, buildDirtySourceKey } from "@/utils/window/dirtyState";

// Mocks
jest.mock("@/hooks/useMetadataContext");

const WINDOW_IDENTIFIER = "143_1000";

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => "143_1000",
}));

describe("TabButton", () => {
  const mockTab = {
    id: "tab1",
    name: "Tab Name",
    title: "Tab Title",
    tabLevel: 1,
  };
  const mockOnClick = jest.fn();
  const mockOnDoubleClick = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.setState({ dirtyWindows: {} });
    (useMetadataContext as jest.Mock).mockReturnValue({ window: { name: "Window Name" } });
  });

  describe("pending-changes marker", () => {
    const markTabDirty = (tabId: string) => {
      useWindowStore.setState({
        dirtyWindows: { [WINDOW_IDENTIFIER]: { [buildDirtySourceKey(DIRTY_SOURCE_KINDS.FORM, tabId)]: true } },
      });
    };

    it("prefixes the marker when this tab has unsaved changes", () => {
      markTabDirty(mockTab.id);

      render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);

      expect(screen.getByText(`${DIRTY_TITLE_PREFIX}Tab Name`)).toBeInTheDocument();
    });

    it("leaves the label untouched when another tab is the dirty one", () => {
      markTabDirty("other-tab");

      render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);

      expect(screen.getByText("Tab Name")).toBeInTheDocument();
    });
  });

  describe("record count badge", () => {
    const renderWithCount = (count: number, hasMore: boolean) => {
      useTabCountsStore.getState().setCount(getTabCountKey(WINDOW_IDENTIFIER, mockTab.id), count, hasMore);
      render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
      return screen.getByTestId(`TabButton__count_${mockTab.id}`);
    };

    beforeEach(() => useTabCountsStore.setState({ counts: {}, partial: {} }));

    it("shows the exact count once every record is loaded", () => {
      expect(renderWithCount(119, false)).toHaveTextContent(/^119$/);
    });

    it("marks the count as partial while more records exist", () => {
      expect(renderWithCount(101, true)).toHaveTextContent(/^101\+$/);
    });

    // ETP-6431: the badge keeps its place while the count is unknown, so the tab strip does not move.
    const renderBadge = (tab = mockTab) => {
      render(
        <TabButton tab={tab as unknown as Tab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />
      );
      return screen.queryByTestId(`TabButton__count_${tab.id}`);
    };

    it("reserves an empty badge while the count of a child tab is unknown", () => {
      const badge = renderBadge();
      expect(badge).toBeEmptyDOMElement();
      expect(badge).toHaveAttribute("data-loading", "true");
      expect(badge).toHaveAttribute("aria-hidden", "true");
    });

    it("gives the placeholder and the count the same reserved width", () => {
      const placeholder = renderBadge();
      const placeholderWidth = placeholder?.className.match(/min-w-\S+/)?.[0];
      act(() => useTabCountsStore.getState().setCount(getTabCountKey(WINDOW_IDENTIFIER, mockTab.id), 7, false));
      const counted = screen.getByTestId(`TabButton__count_${mockTab.id}`);
      expect(counted).toHaveTextContent(/^7$/);
      expect(counted).not.toHaveAttribute("data-loading");
      expect(counted.className).toContain(placeholderWidth);
    });

    it("goes back to the placeholder when the count is cleared", () => {
      const key = getTabCountKey(WINDOW_IDENTIFIER, mockTab.id);
      useTabCountsStore.getState().setCount(key, 3, false);
      renderBadge();
      act(() => useTabCountsStore.getState().clearCount(key));
      expect(screen.getByTestId(`TabButton__count_${mockTab.id}`)).toHaveAttribute("data-loading", "true");
    });

    it("shows no badge on the header tab", () => {
      expect(renderBadge({ ...mockTab, tabLevel: 0 })).toBeNull();
    });
  });

  it("should render the tab name when tabLevel > 0", () => {
    render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
    expect(screen.getByText("Tab Name")).toBeInTheDocument();
  });

  it("should render the window name when tabLevel === 0", () => {
    const rootTab = { ...mockTab, tabLevel: 0 };
    render(<TabButton tab={rootTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
    expect(screen.getByText("Window Name")).toBeInTheDocument();
  });

  it("should render the tab title when isWindow is true", () => {
    render(
      <TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} isWindow={true} />
    );
    expect(screen.getByText("Tab Title")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockOnClick).toHaveBeenCalledWith(mockTab);
  });

  it("should call onDoubleClick when double clicked", () => {
    render(<TabButton tab={mockTab} onClick={mockOnClick} onDoubleClick={mockOnDoubleClick} active={false} />);
    fireEvent.doubleClick(screen.getByRole("button"));
    expect(mockOnDoubleClick).toHaveBeenCalledWith(mockTab);
  });

  it("should show close button when isWindow and canClose are true", () => {
    render(
      <TabButton
        tab={mockTab}
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        active={false}
        isWindow={true}
        canClose={true}
        onClose={mockOnClose}
      />
    );
    const closeButton = screen.getByTitle("Cerrar ventana");
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should return null if no title is resolved", () => {
    (useMetadataContext as jest.Mock).mockReturnValue({ window: null });
    const { container } = render(
      <TabButton
        tab={{ ...mockTab, tabLevel: 0, name: "", title: "" }}
        onClick={mockOnClick}
        onDoubleClick={mockOnDoubleClick}
        active={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
