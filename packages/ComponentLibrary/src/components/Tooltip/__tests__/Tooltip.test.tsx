import { render, screen, fireEvent, act } from "@testing-library/react";
import Tooltip from "../index";

jest.useFakeTimers();

describe("Tooltip", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("renders children without title", () => {
    render(
      <Tooltip>
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByRole("button", { name: "Hover me" })).toBeInTheDocument();
  });

  it("renders children when title is provided", () => {
    render(
      <Tooltip title="My tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByRole("button", { name: "Hover me" })).toBeInTheDocument();
  });

  it("does not show tooltip content initially", () => {
    render(
      <Tooltip title="My tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip after mouse enter and delay", () => {
    render(
      <Tooltip title="Test tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    const wrapper = screen.getByRole("button").parentElement!;
    fireEvent.mouseEnter(wrapper);

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("Test tooltip")).toBeInTheDocument();
  });

  it("hides tooltip after mouse leave", () => {
    render(
      <Tooltip title="Test tooltip">
        <button>Hover me</button>
      </Tooltip>
    );

    const wrapper = screen.getByRole("button").parentElement!;
    fireEvent.mouseEnter(wrapper);

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does not show tooltip when disabled", () => {
    render(
      <Tooltip title="Disabled tooltip" disabled>
        <button>Hover me</button>
      </Tooltip>
    );

    const wrapper = screen.getByRole("button").parentElement!;
    fireEvent.mouseEnter(wrapper);

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("applies containerClassName", () => {
    render(
      <Tooltip title="Test" containerClassName="custom-container">
        <span>Child</span>
      </Tooltip>
    );
    const wrapper = screen.getByText("Child").parentElement;
    expect(wrapper?.className).toContain("custom-container");
  });

  it("renders with position prop top", () => {
    render(
      <Tooltip title="Top tooltip" position="top">
        <button>Button</button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("button").parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("renders with position prop left", () => {
    render(
      <Tooltip title="Left tooltip" position="left">
        <button>Button</button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("button").parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("renders with position prop right", () => {
    render(
      <Tooltip title="Right tooltip" position="right">
        <button>Button</button>
      </Tooltip>
    );
    const wrapper = screen.getByRole("button").parentElement!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });
});

describe("Tooltip near the viewport edge", () => {
  it("stays inside the screen and points the arrow at the trigger", () => {
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const isTooltip = this.getAttribute("role") === "tooltip";
      const rect = isTooltip
        ? { top: 0, left: 0, width: 200, height: 30 }
        : { top: 100, left: window.innerWidth - 30, width: 20, height: 20 };
      return { ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height } as DOMRect;
    });

    render(
      <Tooltip title="Next Record (Alt+Shift+PgDn)">
        <button type="button">Next</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByRole("button"));
    act(() => {
      jest.advanceTimersByTime(600);
    });

    const tooltip = screen.getByRole("tooltip");
    const arrow = tooltip.querySelector<HTMLElement>(".rotate-45");
    expect(tooltip.style.left).toBe(`${window.innerWidth - 208}px`);
    expect(arrow?.style.left).toBe("188px"); // trigger center (innerWidth - 20) - tooltip left

    jest.restoreAllMocks();
  });
});
