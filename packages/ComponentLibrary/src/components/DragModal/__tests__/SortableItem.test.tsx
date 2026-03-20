import { render, screen } from "@testing-library/react";
import SortableItem from "../SortableItem";

jest.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => "",
    },
  },
}));

jest.mock("../styles", () => ({
  useStyle: () => ({
    sx: {
      menuItemStyles: {},
      menuItemDragging: {},
    },
    styles: {
      sortableItemContainer: {},
      sortableItemLeftContainer: {},
      sortableItemLabel: {},
      dragStyles: {},
    },
  }),
}));

jest.mock("../../Toggle/ToggleChip", () => ({
  __esModule: true,
  default: ({ isActive, onToggle }: { isActive: boolean; onToggle: () => void }) => (
    <input type="checkbox" checked={isActive} onChange={onToggle} data-testid="toggle" />
  ),
}));

const makeItem = (overrides = {}) => ({
  id: "item-1",
  label: "Test Item",
  isActive: true,
  ...overrides,
});

describe("SortableItem", () => {
  it("renders the item label", () => {
    render(
      <SortableItem id="item-1" item={makeItem()} onToggle={jest.fn()} icon={<span data-testid="drag-icon">⠿</span>} />
    );
    expect(screen.getByText("Test Item")).toBeInTheDocument();
  });

  it("renders the toggle chip", () => {
    render(<SortableItem id="item-1" item={makeItem()} onToggle={jest.fn()} icon={<span>⠿</span>} />);
    expect(screen.getByTestId("toggle")).toBeInTheDocument();
  });

  it("toggle is checked when item is active", () => {
    render(<SortableItem id="item-1" item={makeItem({ isActive: true })} onToggle={jest.fn()} icon={<span>⠿</span>} />);
    expect(screen.getByTestId("toggle")).toBeChecked();
  });

  it("uses person prop as fallback when item is not provided", () => {
    render(
      <SortableItem
        id="item-1"
        person={makeItem({ label: "Person Label" })}
        onToggle={jest.fn()}
        icon={<span>⠿</span>}
      />
    );
    expect(screen.getByText("Person Label")).toBeInTheDocument();
  });
});
