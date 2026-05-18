import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CustomClickAwayListener from "../clickAway";

describe("CustomClickAwayListener", () => {
  it("renders children", () => {
    render(
      <CustomClickAwayListener onClickAway={jest.fn()}>
        <div data-testid="child">Inside</div>
      </CustomClickAwayListener>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("calls onClickAway when clicking outside", () => {
    const onClickAway = jest.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <CustomClickAwayListener onClickAway={onClickAway}>
          <div data-testid="inside">Inside</div>
        </CustomClickAwayListener>
      </div>
    );

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onClickAway).toHaveBeenCalledTimes(1);
  });

  it("does not call onClickAway when clicking inside", () => {
    const onClickAway = jest.fn();
    render(
      <CustomClickAwayListener onClickAway={onClickAway}>
        <div data-testid="inside">Inside</div>
      </CustomClickAwayListener>
    );

    fireEvent.mouseDown(screen.getByTestId("inside"));
    expect(onClickAway).not.toHaveBeenCalled();
  });

  it("removes event listener on unmount", () => {
    const onClickAway = jest.fn();
    const removeSpy = jest.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <CustomClickAwayListener onClickAway={onClickAway}>
        <div>Inside</div>
      </CustomClickAwayListener>
    );

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    removeSpy.mockRestore();
  });
});
