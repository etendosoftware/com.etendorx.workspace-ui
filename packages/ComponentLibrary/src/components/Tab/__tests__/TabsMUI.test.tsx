import { render, screen, fireEvent } from "@testing-library/react";
import TabsMUI from "../index";

jest.mock("@mui/material/styles", () => ({
  ...jest.requireActual("@mui/material/styles"),
  useTheme: () => ({
    palette: {
      primary: { main: "#1976d2" },
      dynamicColor: { contrastText: "#ffffff" },
    },
    spacing: (factor: number) => `${8 * factor}px`,
    breakpoints: {
      up: () => "@media (min-width: 0px)",
      down: () => "@media (max-width: 0px)",
    },
  }),
}));

const tabs = [
  { title: "Tab One", children: <div>Content 1</div> },
  { title: "Tab Two", children: <div>Content 2</div> },
  { title: "Tab Three", children: <div>Content 3</div> },
];

describe("TabsMUI", () => {
  it("renders all tab labels", () => {
    render(<TabsMUI tabArray={tabs} />);
    expect(screen.getByText("Tab One")).toBeInTheDocument();
    expect(screen.getByText("Tab Two")).toBeInTheDocument();
    expect(screen.getByText("Tab Three")).toBeInTheDocument();
  });

  it("renders first tab content by default", () => {
    render(<TabsMUI tabArray={tabs} />);
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("renders without crashing when tabArray is empty", () => {
    const { container } = render(<TabsMUI tabArray={[]} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("changes tab on click", () => {
    render(<TabsMUI tabArray={tabs} />);
    fireEvent.click(screen.getByText("Tab Two"));
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });

  it("renders with a single tab", () => {
    render(<TabsMUI tabArray={[{ title: "Only Tab", children: <div>Only Content</div> }]} />);
    expect(screen.getByText("Only Tab")).toBeInTheDocument();
    expect(screen.getByText("Only Content")).toBeInTheDocument();
  });
});
