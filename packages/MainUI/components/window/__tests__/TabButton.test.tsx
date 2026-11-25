import { act, render, screen, fireEvent } from "@testing-library/react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { CHILD_TAB_LABEL_CLASSES, TabButton } from "../TabButton";
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

    // ETP-6431: the tab keeps room for the count; the title is centered until the count is known.
    const renderTab = () => {
      render(
        <TabButton
          tab={mockTab as unknown as Tab}
          onClick={mockOnClick}
          onDoubleClick={mockOnDoubleClick}
          active={false}
        />
      );
      return { badge: screen.queryByTestId(`TabButton__count_${mockTab.id}`), title: screen.getByText(mockTab.name) };
    };
    const setCount = (count: number) =>
      act(() => useTabCountsStore.getState().setCount(getTabCountKey(WINDOW_IDENTIFIER, mockTab.id), count, false));

    it("keeps the title centered in the room of the count while the count is unknown", () => {
      const { badge, title } = renderTab();

      expect(badge).toBeNull();
      expect(title.parentElement).toHaveClass(...CHILD_TAB_LABEL_CLASSES.split(" "));
      expect(title).toHaveClass("translate-x-3.5");
    });

    it("keeps the count shown right after the title once it is known", () => {
      setCount(7);
      const { badge, title } = renderTab();

      expect(badge).toHaveTextContent(/^7$/);
      expect(badge).toBeVisible();
      expect(badge?.parentElement).toBe(title);
      expect(title).not.toHaveClass("translate-x-3.5");
    });

    it("slides the title aside when the count arrives and centers it again when it is cleared", () => {
      const { title } = renderTab();
      setCount(3);
      expect(title).not.toHaveClass("translate-x-3.5");

      act(() => useTabCountsStore.getState().clearCount(getTabCountKey(WINDOW_IDENTIFIER, mockTab.id)));

      expect(screen.queryByTestId(`TabButton__count_${mockTab.id}`)).toBeNull();
      expect(title).toHaveClass("translate-x-3.5");
    });

    it("shows no count on the header tab", () => {
      render(
        <TabButton
          tab={{ ...mockTab, tabLevel: 0 } as unknown as Tab}
          onClick={mockOnClick}
          onDoubleClick={mockOnDoubleClick}
          active={false}
        />
      );
      expect(screen.queryByTestId(`TabButton__count_${mockTab.id}`)).toBeNull();
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
