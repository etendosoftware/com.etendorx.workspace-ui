import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { getFocusableElements, setFocusReturnTarget, useFocusScope } from "../useFocusScope";

interface HarnessProps {
  open: boolean;
  /** Hides the content, as a popup that is still fading in. */
  hidden?: boolean;
  trap?: boolean;
  restoreFocus?: boolean;
  withButtons?: boolean;
}

const Harness = ({ open, hidden = false, trap = false, restoreFocus, withButtons = true }: HarnessProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useFocusScope(ref, open, { trap, restoreFocus });
  return (
    <div>
      <button type="button">opener</button>
      <button type="button">outside</button>
      {open && (
        <div ref={ref} data-testid="scope" onKeyDown={onKeyDown} style={{ visibility: hidden ? "hidden" : "visible" }}>
          {withButtons && (
            <>
              <button type="button">first</button>
              <button type="button">middle</button>
              <button type="button">last</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

describe("getFocusableElements (ETP-6304)", () => {
  it("lists the reachable elements and leaves the hidden and disabled ones out", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <button>a</button>
      <button disabled>disabled</button>
      <button style="display:none">none</button>
      <div hidden><button>in hidden</button></div>
      <div aria-hidden="true"><button>in aria-hidden</button></div>
      <input type="hidden" />
      <a href="#x">link</a>
      <div tabindex="-1">programmatic only</div>
      <div tabindex="0">tabbable</div>`;
    document.body.appendChild(container);

    const names = getFocusableElements(container).map((element) => element.textContent?.trim() || element.tagName);
    container.remove();

    expect(names).toEqual(["a", "link", "tabbable"]);
  });
});

describe("useFocusScope (ETP-6304)", () => {
  it("moves the focus to the first reachable element when it opens", () => {
    const { rerender } = render(<Harness open={false} />);
    screen.getByText("opener").focus();

    rerender(<Harness open />);

    expect(screen.getByText("first")).toHaveFocus();
  });

  it("focuses the container when it has nothing reachable inside", async () => {
    const { rerender } = render(<Harness open={false} withButtons={false} />);
    rerender(<Harness open withButtons={false} />);

    await waitFor(() => expect(screen.getByTestId("scope")).toHaveFocus(), { timeout: 2000 });
  });

  it("waits for hidden content to become visible before it takes the focus", async () => {
    const { rerender } = render(<Harness open={false} />);
    rerender(<Harness open hidden />);
    expect(screen.getByText("first")).not.toHaveFocus();

    rerender(<Harness open hidden={false} />);

    await waitFor(() => expect(screen.getByText("first")).toHaveFocus());
  });

  it("gives the focus back to the opener when it closes", () => {
    const { rerender } = render(<Harness open={false} />);
    screen.getByText("opener").focus();
    rerender(<Harness open />);

    rerender(<Harness open={false} />);

    expect(screen.getByText("opener")).toHaveFocus();
  });

  it("does not take the focus back when the user already moved it elsewhere", () => {
    const { rerender } = render(<Harness open={false} />);
    screen.getByText("opener").focus();
    rerender(<Harness open />);
    screen.getByText("outside").focus();

    rerender(<Harness open={false} />);

    expect(screen.getByText("outside")).toHaveFocus();
  });

  it("does not give the focus back when restoreFocus is off", () => {
    const { rerender } = render(<Harness open={false} restoreFocus={false} />);
    screen.getByText("opener").focus();
    rerender(<Harness open restoreFocus={false} />);

    rerender(<Harness open={false} restoreFocus={false} />);

    expect(screen.getByText("opener")).not.toHaveFocus();
  });

  describe("trap", () => {
    it("sends Tab from the last element to the first", () => {
      render(<Harness open trap />);
      screen.getByText("last").focus();

      const notCancelled = fireEvent.keyDown(screen.getByText("last"), { key: "Tab" });

      expect(notCancelled).toBe(false);
      expect(screen.getByText("first")).toHaveFocus();
    });

    it("sends Shift+Tab from the first element to the last", () => {
      render(<Harness open trap />);
      screen.getByText("first").focus();

      fireEvent.keyDown(screen.getByText("first"), { key: "Tab", shiftKey: true });

      expect(screen.getByText("last")).toHaveFocus();
    });

    it("lets Tab move between the elements in the middle", () => {
      render(<Harness open trap />);
      screen.getByText("middle").focus();

      const notCancelled = fireEvent.keyDown(screen.getByText("middle"), { key: "Tab" });

      expect(notCancelled).toBe(true);
    });

    it("keeps the focus on the container when there is nothing to reach", () => {
      render(<Harness open trap withButtons={false} />);

      fireEvent.keyDown(screen.getByTestId("scope"), { key: "Tab" });

      expect(screen.getByTestId("scope")).toHaveFocus();
    });

    it("leaves Tab alone without trap", () => {
      render(<Harness open />);
      screen.getByText("last").focus();

      const notCancelled = fireEvent.keyDown(screen.getByText("last"), { key: "Tab" });

      expect(notCancelled).toBe(true);
    });
  });

  it("gives the focus back to the target of the popup it was opened from, which may be gone by then", () => {
    const Popup = ({ showPopup, dialogOpen }: { showPopup: boolean; dialogOpen: boolean }) => (
      <div>
        <button type="button">menu button</button>
        {showPopup && (
          <div data-testid="popup">
            <button type="button">menu item</button>
          </div>
        )}
        <Harness open={dialogOpen} />
      </div>
    );
    const { rerender } = render(<Popup showPopup dialogOpen={false} />);
    setFocusReturnTarget(screen.getByTestId("popup"), screen.getByText("menu button"));
    screen.getByText("menu item").focus();

    // the dialog opens from the menu item, and the menu goes away
    rerender(<Popup showPopup dialogOpen />);
    rerender(<Popup showPopup={false} dialogOpen />);
    rerender(<Popup showPopup={false} dialogOpen={false} />);

    expect(screen.getByText("menu button")).toHaveFocus();
  });

  it("gives the focus back when the popup is removed in the same render that opens the dialog", () => {
    const Popup = ({ popupOpen, dialogOpen }: { popupOpen: boolean; dialogOpen: boolean }) => (
      <div>
        <button type="button">menu button</button>
        {popupOpen && (
          <div data-testid="popup">
            <button type="button">menu item</button>
          </div>
        )}
        <Harness open={dialogOpen} />
      </div>
    );
    const { rerender } = render(<Popup popupOpen dialogOpen={false} />);
    setFocusReturnTarget(screen.getByTestId("popup"), screen.getByText("menu button"));
    screen.getByText("menu item").focus();

    // one render removes the menu item that has the focus and opens the dialog
    rerender(<Popup popupOpen={false} dialogOpen />);
    rerender(<Popup popupOpen={false} dialogOpen={false} />);

    expect(screen.getByText("menu button")).toHaveFocus();
  });
});
