import { render, screen } from "@testing-library/react";
import WaterfallDropdown from "../WaterfallModal";

jest.mock("../../IconButton", () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }: any) => (
    <button data-testid="waterfall-trigger" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock("../../Menu", () => ({
  __esModule: true,
  default: ({ children, anchorEl, onClose }: any) =>
    anchorEl ? (
      <div data-testid="menu" role="menu">
        {children}
        <button data-testid="close-menu" onClick={onClose}>
          close
        </button>
      </div>
    ) : null,
}));

jest.mock("../../ModalDivider", () => ({
  __esModule: true,
  default: () => <hr data-testid="modal-divider" />,
}));

jest.mock("../../DragModal/DragModalContent", () => ({
  __esModule: true,
  default: ({ onBack }: any) => (
    <div data-testid="drag-modal-content">
      <button data-testid="drag-back" onClick={onBack}>
        back
      </button>
    </div>
  ),
}));

const defaultMenuItems = [
  { key: "item1", label: "Option 1", emoji: "🔧" },
  { key: "item2", label: "Option 2", emoji: "📋" },
];

const defaultItems = [
  { id: "col1", label: "Column 1", isActive: true },
  { id: "col2", label: "Column 2", isActive: false },
];

describe("WaterfallDropdown", () => {
  it("renders the trigger button", () => {
    render(
      <WaterfallDropdown
        menuItems={defaultMenuItems}
        items={defaultItems}
        setItems={jest.fn()}
        icon={<span>icon</span>}
      />
    );
    expect(screen.getByTestId("waterfall-trigger")).toBeInTheDocument();
  });

  it("trigger button is disabled by default", () => {
    render(
      <WaterfallDropdown
        menuItems={defaultMenuItems}
        items={defaultItems}
        setItems={jest.fn()}
        icon={<span>icon</span>}
      />
    );
    expect(screen.getByTestId("waterfall-trigger")).toBeDisabled();
  });

  it("does not show menu initially (anchorEl is null)", () => {
    render(
      <WaterfallDropdown
        menuItems={defaultMenuItems}
        items={defaultItems}
        setItems={jest.fn()}
        icon={<span>icon</span>}
      />
    );
    expect(screen.queryByTestId("menu")).not.toBeInTheDocument();
  });

  it("renders the icon prop", () => {
    render(
      <WaterfallDropdown
        menuItems={defaultMenuItems}
        items={defaultItems}
        setItems={jest.fn()}
        icon={<span data-testid="custom-icon">★</span>}
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("renders with tooltip prop", () => {
    const { container } = render(
      <WaterfallDropdown
        menuItems={defaultMenuItems}
        items={defaultItems}
        setItems={jest.fn()}
        icon={<span>icon</span>}
        tooltipWaterfallButton="Show options"
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
