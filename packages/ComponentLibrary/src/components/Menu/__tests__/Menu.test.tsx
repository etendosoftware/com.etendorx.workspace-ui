import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import Menu from "../index";

jest.useFakeTimers();

const Harness = ({ onClose }: { onClose?: () => void }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <div>
      <button
        type="button"
        onClick={(event) => setAnchor(event.currentTarget)}
        onKeyDown={(event) => event.key === "Enter" && setAnchor(event.currentTarget)}>
        opener
      </button>
      <button type="button">elsewhere</button>
      <Menu
        anchorEl={anchor}
        onClose={() => {
          setAnchor(null);
          onClose?.();
        }}>
        <button type="button">one</button>
        <button type="button">two</button>
        <button type="button">three</button>
      </Menu>
    </div>
  );
};

const openMenu = () => {
  const opener = screen.getByText("opener");
  opener.focus();
  fireEvent.click(opener);
  act(() => {
    jest.runOnlyPendingTimers();
  });
  return opener;
};

describe("Menu keyboard and focus (ETP-6304)", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("moves the focus to its first item when it opens", () => {
    render(<Harness />);
    openMenu();

    expect(screen.getByText("one")).toHaveFocus();
  });

  it("moves between the items with the arrow keys and wraps around", () => {
    render(<Harness />);
    openMenu();

    fireEvent.keyDown(screen.getByText("one"), { key: "ArrowDown" });
    expect(screen.getByText("two")).toHaveFocus();
    fireEvent.keyDown(screen.getByText("two"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByText("three"), { key: "ArrowDown" });
    expect(screen.getByText("one")).toHaveFocus();
    fireEvent.keyDown(screen.getByText("one"), { key: "ArrowUp" });
    expect(screen.getByText("three")).toHaveFocus();
  });

  it("goes to the first and the last item with Home and End", () => {
    render(<Harness />);
    openMenu();

    fireEvent.keyDown(screen.getByText("one"), { key: "End" });
    expect(screen.getByText("three")).toHaveFocus();
    fireEvent.keyDown(screen.getByText("three"), { key: "Home" });
    expect(screen.getByText("one")).toHaveFocus();
  });

  it("closes with Escape and gives the focus back to its button", () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);
    const opener = openMenu();

    fireEvent.keyDown(document, { key: "Escape" });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
  });

  it("closes with Tab instead of leaving the focus in a menu that stays open", () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);
    const opener = openMenu();

    const notCancelled = fireEvent.keyDown(screen.getByText("one"), { key: "Tab" });
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(notCancelled).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(opener).toHaveFocus();
  });
});
