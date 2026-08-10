import { render, screen, fireEvent } from "@testing-library/react";
import ResizeHandle, {
  RESIZE_KEYBOARD_STEP,
  RESIZE_RESET_PERCENTAGE,
  getResizeStepForKey,
  isInteractiveTarget,
} from "../index";

/** Simulates a full drag gesture: press on `handle`, move, release. */
const drag = (handle: HTMLElement, { fromX = 0, toX = 0, fromY = 0, toY = 0 } = {}) => {
  fireEvent.mouseDown(handle, { clientX: fromX, clientY: fromY });
  fireEvent.mouseMove(document, { clientX: toX, clientY: toY });
  fireEvent.mouseUp(document);
};

/** Builds a container ref whose measured size is fixed, as jsdom never lays out. */
const containerRefOf = (width: number) => {
  const element = document.createElement("div");
  element.getBoundingClientRect = () => ({ width, height: width }) as DOMRect;
  return { current: element };
};

describe("ResizeHandle — wrapper variant (default)", () => {
  it("renders children", () => {
    render(
      <ResizeHandle>
        <div data-testid="child-content">Content</div>
      </ResizeHandle>
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders in vertical direction by default", () => {
    const { container } = render(<ResizeHandle />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders in horizontal direction", () => {
    const { container } = render(<ResizeHandle direction="horizontal" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the drag handle by default", () => {
    const { container } = render(<ResizeHandle />);
    const handle = container.querySelector("[data-resizer]");
    expect(handle).toBeInTheDocument();
  });

  it("hides handle when hideHandle is true", () => {
    const { container } = render(<ResizeHandle hideHandle />);
    const handle = container.querySelector("[data-resizer]");
    expect(handle).not.toBeInTheDocument();
  });

  it("calls onHeightChange when double-clicked in vertical mode", () => {
    const onHeightChange = jest.fn();
    const { container } = render(<ResizeHandle onHeightChange={onHeightChange} direction="vertical" />);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.doubleClick(wrapper);
    expect(onHeightChange).toHaveBeenCalledWith(RESIZE_RESET_PERCENTAGE);
  });

  it("does not call onHeightChange on double-click in horizontal mode", () => {
    const onHeightChange = jest.fn();
    const { container } = render(<ResizeHandle onHeightChange={onHeightChange} direction="horizontal" />);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.doubleClick(wrapper);
    expect(onHeightChange).not.toHaveBeenCalled();
  });

  // Regression guard: the Drawer wraps its whole content in a horizontal handle,
  // so a double-click on a menu item must not reset its width.
  it("does not reset the width on double-click in horizontal mode", () => {
    const onWidthChange = jest.fn();
    const { container } = render(<ResizeHandle onWidthChange={onWidthChange} direction="horizontal" />);
    fireEvent.doubleClick(container.firstChild as HTMLElement);
    expect(onWidthChange).not.toHaveBeenCalled();
  });

  it("still starts a drag from a plain child element", () => {
    const onHeightChange = jest.fn();
    render(
      <ResizeHandle onHeightChange={onHeightChange}>
        <div data-testid="child-content">Content</div>
      </ResizeHandle>
    );
    drag(screen.getByTestId("child-content"), { fromY: 300, toY: 200 });
    expect(onHeightChange).toHaveBeenCalled();
  });

  it("does not start a drag from an interactive child element", () => {
    const onHeightChange = jest.fn();
    render(
      <ResizeHandle onHeightChange={onHeightChange}>
        <button type="button" data-testid="child-button">
          Click
        </button>
      </ResizeHandle>
    );
    drag(screen.getByTestId("child-button"), { fromY: 300, toY: 200 });
    expect(onHeightChange).not.toHaveBeenCalled();
  });
});

describe("isInteractiveTarget", () => {
  it.each(["INPUT", "BUTTON", "TEXTAREA"])("detects a bare <%s>", (tagName) => {
    expect(isInteractiveTarget(document.createElement(tagName))).toBe(true);
  });

  it("detects an element nested inside a control", () => {
    const button = document.createElement("button");
    const span = document.createElement("span");
    button.appendChild(span);
    expect(isInteractiveTarget(span)).toBe(true);
  });

  it("ignores a plain element", () => {
    expect(isInteractiveTarget(document.createElement("div"))).toBe(false);
  });
});

describe("ResizeHandle — divider variant", () => {
  const renderDivider = (props: Partial<React.ComponentProps<typeof ResizeHandle>> = {}) =>
    render(
      <ResizeHandle variant="divider" direction="horizontal" initialWidth={50} minWidth={20} maxWidth={80} {...props}>
        <div data-testid="child-content">Content</div>
      </ResizeHandle>
    );

  it("renders only the grab bar, never the children", () => {
    renderDivider();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
  });

  it("exposes the current proportion and its bounds to assistive technology", () => {
    renderDivider({ initialWidth: 35 });
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator).toHaveAttribute("aria-valuenow", "35");
    expect(separator).toHaveAttribute("aria-valuemin", "20");
    expect(separator).toHaveAttribute("aria-valuemax", "80");
  });

  it("reports a new width while dragging the bar", () => {
    const onWidthChange = jest.fn();
    renderDivider({ onWidthChange, containerRef: containerRefOf(1000), maxOffsetRem: 0 });

    // +100px on a 1000px container ⇒ +10 percentage points from 50.
    drag(screen.getByRole("separator"), { fromX: 500, toX: 600 });
    expect(onWidthChange).toHaveBeenCalledWith(60);
  });

  it("measures percentages against the container, not the viewport", () => {
    const onWidthChange = jest.fn();
    renderDivider({ onWidthChange, containerRef: containerRefOf(500), maxOffsetRem: 0 });

    // The same +100px is worth twice as much on a container half the width.
    drag(screen.getByRole("separator"), { fromX: 500, toX: 600 });
    expect(onWidthChange).toHaveBeenCalledWith(70);
  });

  it("falls back to the viewport when the container has not been laid out", () => {
    const onWidthChange = jest.fn();
    renderDivider({ onWidthChange, containerRef: containerRefOf(0), maxOffsetRem: 0 });

    const expected = 50 + (100 / window.innerWidth) * 100;
    drag(screen.getByRole("separator"), { fromX: 500, toX: 600 });
    expect(onWidthChange).toHaveBeenCalledWith(expected);
  });

  it("clamps the width to the configured bounds", () => {
    const onWidthChange = jest.fn();
    renderDivider({ onWidthChange, containerRef: containerRefOf(1000), maxOffsetRem: 0 });

    drag(screen.getByRole("separator"), { fromX: 500, toX: 5000 });
    expect(onWidthChange).toHaveBeenLastCalledWith(80);

    drag(screen.getByRole("separator"), { fromX: 500, toX: -5000 });
    expect(onWidthChange).toHaveBeenLastCalledWith(20);
  });

  it("reports the final width once when the drag ends", () => {
    const onWidthChangeEnd = jest.fn();
    renderDivider({
      onWidthChange: jest.fn(),
      onWidthChangeEnd,
      containerRef: containerRefOf(1000),
      maxOffsetRem: 0,
    });

    drag(screen.getByRole("separator"), { fromX: 500, toX: 600 });
    expect(onWidthChangeEnd).toHaveBeenCalledTimes(1);
    expect(onWidthChangeEnd).toHaveBeenCalledWith(60);
  });

  it("does not report a drag end for a click without movement", () => {
    const onWidthChangeEnd = jest.fn();
    renderDivider({ onWidthChange: jest.fn(), onWidthChangeEnd });

    fireEvent.mouseDown(screen.getByRole("separator"), { clientX: 500 });
    fireEvent.mouseUp(document);
    expect(onWidthChangeEnd).not.toHaveBeenCalled();
  });

  it("resets the proportion on double-click", () => {
    const onWidthChange = jest.fn();
    const onWidthChangeEnd = jest.fn();
    renderDivider({ initialWidth: 25, onWidthChange, onWidthChangeEnd });

    fireEvent.doubleClick(screen.getByRole("separator"));
    expect(onWidthChange).toHaveBeenCalledWith(RESIZE_RESET_PERCENTAGE);
    expect(onWidthChangeEnd).toHaveBeenCalledWith(RESIZE_RESET_PERCENTAGE);
  });

  describe("keyboard operation", () => {
    it("is reachable with the keyboard", () => {
      renderDivider();
      expect(screen.getByRole("separator")).toHaveAttribute("tabindex", "0");
    });

    it.each([
      ["ArrowRight", 50 + RESIZE_KEYBOARD_STEP],
      ["ArrowLeft", 50 - RESIZE_KEYBOARD_STEP],
    ])("moves the split by one step on %s", (key, expected) => {
      const onWidthChange = jest.fn();
      const onWidthChangeEnd = jest.fn();
      renderDivider({ onWidthChange, onWidthChangeEnd, containerRef: containerRefOf(1000), maxOffsetRem: 0 });

      fireEvent.keyDown(screen.getByRole("separator"), { key });

      expect(onWidthChange).toHaveBeenCalledWith(expected);
      expect(onWidthChangeEnd).toHaveBeenCalledWith(expected);
    });

    it("clamps at the bounds instead of overshooting", () => {
      const onWidthChange = jest.fn();
      renderDivider({ initialWidth: 79, onWidthChange, containerRef: containerRefOf(1000), maxOffsetRem: 0 });

      fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });

      expect(onWidthChange).toHaveBeenCalledWith(80);
    });

    it("ignores keys that do not resize this orientation", () => {
      const onWidthChange = jest.fn();
      renderDivider({ onWidthChange });

      fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowUp" });
      fireEvent.keyDown(screen.getByRole("separator"), { key: "Enter" });

      expect(onWidthChange).not.toHaveBeenCalled();
    });
  });
});

describe("getResizeStepForKey", () => {
  it.each([
    ["ArrowUp", RESIZE_KEYBOARD_STEP],
    ["ArrowDown", -RESIZE_KEYBOARD_STEP],
    ["ArrowLeft", 0],
    ["ArrowRight", 0],
    ["Enter", 0],
  ])("vertical divider: %s → %s", (key, expected) => {
    expect(getResizeStepForKey(key, true)).toBe(expected);
  });

  it.each([
    ["ArrowRight", RESIZE_KEYBOARD_STEP],
    ["ArrowLeft", -RESIZE_KEYBOARD_STEP],
    ["ArrowUp", 0],
    ["ArrowDown", 0],
    ["Enter", 0],
  ])("horizontal divider: %s → %s", (key, expected) => {
    expect(getResizeStepForKey(key, false)).toBe(expected);
  });
});
