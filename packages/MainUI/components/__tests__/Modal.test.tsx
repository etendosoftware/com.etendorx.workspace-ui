import { act, fireEvent, render, screen } from "@testing-library/react";
import Modal from "../Modal";

jest.useFakeTimers();

const Harness = ({ open, onClose = jest.fn() }: { open: boolean; onClose?: () => void }) => (
  <div>
    <button type="button">opener</button>
    <Modal open={open} onClose={onClose} ariaLabelledBy="dialog-title">
      <h3 id="dialog-title">Title</h3>
      <button type="button">first</button>
      <button type="button">last</button>
    </Modal>
  </div>
);

describe("Modal keyboard and screen reader behaviour (ETP-6304)", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it("is a modal dialog named by its title while it is open", () => {
    render(<Harness open />);

    const dialog = screen.getByRole("dialog", { name: "Title" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("is not exposed as a dialog while it is closed", () => {
    render(<Harness open={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("takes the focus when it opens", () => {
    const { rerender } = render(<Harness open={false} />);
    screen.getByText("opener").focus();

    rerender(<Harness open />);

    expect(screen.getByText("first")).toHaveFocus();
  });

  it("keeps the focus inside while Tab is pressed", () => {
    render(<Harness open />);
    screen.getByText("last").focus();

    fireEvent.keyDown(screen.getByText("last"), { key: "Tab" });

    expect(screen.getByText("first")).toHaveFocus();
  });

  it("closes with Escape", () => {
    const onClose = jest.fn();
    render(<Harness open onClose={onClose} />);

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("gives the focus back to the element that opened it when it closes", () => {
    const { rerender } = render(<Harness open={false} />);
    const opener = screen.getByText("opener");
    opener.focus();
    rerender(<Harness open />);

    rerender(<Harness open={false} />);
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(opener).toHaveFocus();
  });
});
