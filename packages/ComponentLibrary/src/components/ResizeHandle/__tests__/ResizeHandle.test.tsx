import { render, screen, fireEvent } from "@testing-library/react";
import ResizeHandle from "../index";

describe("ResizeHandle", () => {
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
    expect(onHeightChange).toHaveBeenCalledWith(50);
  });

  it("does not call onHeightChange on double-click in horizontal mode", () => {
    const onHeightChange = jest.fn();
    const { container } = render(<ResizeHandle onHeightChange={onHeightChange} direction="horizontal" />);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.doubleClick(wrapper);
    expect(onHeightChange).not.toHaveBeenCalled();
  });
});
