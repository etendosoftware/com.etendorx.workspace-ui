import { render, screen } from "@testing-library/react";
import ContentGrid from "../WidgetContent";

jest.mock("../../styles", () => ({
  useStyle: () => ({
    sx: {
      widgetContainer: {},
      widgetHeader: {},
      widgetHeaderLeft: {},
      widgetHeaderIcon: {},
      widgetBox: {},
      gridContainer: {},
    },
  }),
}));

jest.mock("../../../IconButton", () => ({
  __esModule: true,
  default: ({ children, onClick }: any) => (
    <button data-testid="icon-button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe("ContentGrid", () => {
  it("renders without crashing with empty widgets", () => {
    const { container } = render(<ContentGrid widgets={[]} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders a widget with title", () => {
    const widgets = [{ id: "w1", title: "My Widget", size: "half" }];
    render(<ContentGrid widgets={widgets} />);
    expect(screen.getByText("My Widget")).toBeInTheDocument();
  });

  it("renders multiple widgets", () => {
    const widgets = [
      { id: "w1", title: "Widget One", size: "half" },
      { id: "w2", title: "Widget Two", size: "full" },
    ];
    render(<ContentGrid widgets={widgets} />);
    expect(screen.getByText("Widget One")).toBeInTheDocument();
    expect(screen.getByText("Widget Two")).toBeInTheDocument();
  });

  it("renders icon button when iconButtonAction is provided", () => {
    const widgets = [{ id: "w1", title: "Widget", size: "half", iconButtonAction: jest.fn(), tooltip: "info" }];
    render(<ContentGrid widgets={widgets} />);
    expect(screen.getByTestId("icon-button")).toBeInTheDocument();
  });

  it("does not render icon button when iconButtonAction is not provided", () => {
    const widgets = [{ id: "w1", title: "Widget", size: "half" }];
    render(<ContentGrid widgets={widgets} />);
    expect(screen.queryByTestId("icon-button")).not.toBeInTheDocument();
  });

  it("renders widget children content", () => {
    const widgets = [
      { id: "w1", title: "Widget", size: "half", children: <span data-testid="widget-child">Content</span> },
    ];
    render(<ContentGrid widgets={widgets} />);
    expect(screen.getByTestId("widget-child")).toBeInTheDocument();
  });
});
