import { render, screen, fireEvent } from "@testing-library/react";
import DragModalContent from "../DragModalContent";

jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MouseSensor: class MouseSensor {},
  TouchSensor: class TouchSensor {},
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn(() => []),
  closestCenter: jest.fn(),
}));

jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  arrayMove: jest.fn((arr, from, to) => arr),
  verticalListSortingStrategy: {},
}));

jest.mock("@dnd-kit/modifiers", () => ({
  restrictToParentElement: {},
  restrictToVerticalAxis: {},
}));

jest.mock("../SortableItem", () => ({
  __esModule: true,
  default: ({ item, onToggle }: { item: any; onToggle: () => void }) => (
    <div data-testid={`sortable-item-${item.id}`}>
      <span>{item.label}</span>
      <button onClick={onToggle} data-testid={`toggle-${item.id}`}>
        toggle
      </button>
    </div>
  ),
}));

jest.mock("../../ModalDivider", () => ({
  __esModule: true,
  default: () => <hr data-testid="divider" />,
}));

jest.mock("../styles", () => ({
  useStyle: () => ({
    sx: {
      headerBox: {},
      customizeButton: {},
      linkStyles: {},
    },
    styles: {
      sectionContainer: {},
      StartIconStyles: {},
      CustomizeButton: {},
      containerStyles: {},
    },
  }),
}));

const defaultItems = [
  { id: "a", label: "Item A", isActive: true },
  { id: "b", label: "Item B", isActive: false },
];

describe("DragModalContent", () => {
  it("renders without crashing", () => {
    const { container } = render(<DragModalContent items={defaultItems} setItems={jest.fn()} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the back button", () => {
    render(<DragModalContent items={defaultItems} setItems={jest.fn()} onBack={jest.fn()} backButtonText="Go Back" />);
    expect(screen.getByText("Go Back")).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", () => {
    const onBack = jest.fn();
    render(<DragModalContent items={defaultItems} setItems={jest.fn()} onBack={onBack} backButtonText="Back" />);
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders buttonText label", () => {
    render(<DragModalContent items={defaultItems} setItems={jest.fn()} buttonText="Columns" />);
    expect(screen.getByText("Columns")).toBeInTheDocument();
  });

  it("renders sortable items for each item", () => {
    render(<DragModalContent items={defaultItems} setItems={jest.fn()} />);
    expect(screen.getByTestId("sortable-item-a")).toBeInTheDocument();
    expect(screen.getByTestId("sortable-item-b")).toBeInTheDocument();
  });

  it("shows deactivateAllText when all items are active", () => {
    const allActive = [
      { id: "a", label: "A", isActive: true },
      { id: "b", label: "B", isActive: true },
    ];
    render(
      <DragModalContent
        items={allActive}
        setItems={jest.fn()}
        activateAllText="Activate All"
        deactivateAllText="Deactivate All"
      />
    );
    expect(screen.getByText("Deactivate All")).toBeInTheDocument();
  });

  it("shows activateAllText when not all items are active", () => {
    render(
      <DragModalContent
        items={defaultItems}
        setItems={jest.fn()}
        activateAllText="Activate All"
        deactivateAllText="Deactivate All"
      />
    );
    expect(screen.getByText("Activate All")).toBeInTheDocument();
  });

  it("calls setItems when toggle all is clicked", () => {
    const setItems = jest.fn();
    render(<DragModalContent items={defaultItems} setItems={setItems} activateAllText="Activate All" />);
    fireEvent.click(screen.getByText("Activate All"));
    expect(setItems).toHaveBeenCalledTimes(1);
  });

  it("calls setItems when individual toggle is clicked", () => {
    const setItems = jest.fn();
    render(<DragModalContent items={defaultItems} setItems={setItems} />);
    fireEvent.click(screen.getByTestId("toggle-a"));
    expect(setItems).toHaveBeenCalledTimes(1);
  });

  it("works with empty items array", () => {
    const { container } = render(<DragModalContent items={[]} setItems={jest.fn()} />);
    expect(container.firstChild).toBeTruthy();
  });
});
