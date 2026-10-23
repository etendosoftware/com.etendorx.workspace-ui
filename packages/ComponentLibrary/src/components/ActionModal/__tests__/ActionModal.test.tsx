import { render, screen, fireEvent } from "@testing-library/react";
import ActionModal from "../index";
import type { ActionModalProps } from "../types";

describe("ActionModal", () => {
  const mockOnClose = jest.fn();
  const mockT = jest.fn((key) => key);

  const defaultProps: ActionModalProps = {
    isOpen: true,
    title: "Test Title",
    message: "Test Message",
    buttons: [],
    onClose: mockOnClose,
    t: mockT,
  };

  it("renders correctly when open", () => {
    render(<ActionModal {...defaultProps} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Message")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ActionModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<ActionModal {...defaultProps} />);
    const closeButton = screen.getByLabelText("common.close");
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders buttons correctly", () => {
    const buttons = [
      { id: "button1", label: "Button 1", onClick: jest.fn(), variant: "primary" as const },
      { id: "button2", label: "Button 2", onClick: jest.fn(), variant: "secondary" as const },
    ];
    render(<ActionModal {...defaultProps} buttons={buttons} />);
    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
  });

  it("calls button onClick handler when clicked", () => {
    const mockOnClick = jest.fn();
    const buttons = [{ id: "button1", label: "Action Button", onClick: mockOnClick, variant: "primary" as const }];
    render(<ActionModal {...defaultProps} buttons={buttons} />);
    fireEvent.click(screen.getByText("Action Button"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("shows loading overlay when isLoading is true", () => {
    render(<ActionModal {...defaultProps} isLoading={true} />);
    const closeButton = screen.getByLabelText("common.close");
    expect(closeButton).toBeDisabled();
  });

  it("disables buttons when isLoading is true", () => {
    const buttons = [{ id: "button1", label: "Action Button", onClick: jest.fn(), variant: "primary" as const }];
    render(<ActionModal {...defaultProps} buttons={buttons} isLoading={true} />);
    expect(screen.getByText("Action Button")).toBeDisabled();
  });

  describe("keyboard", () => {
    const YES = "Yes";
    const NO = "No";
    const documentListener = jest.fn();
    const keyboardButtons = [
      { id: "yes", label: YES, onClick: jest.fn(), variant: "primary" as const },
      { id: "no", label: NO, onClick: jest.fn(), variant: "secondary" as const },
    ];
    const renderDialog = (props: Partial<ActionModalProps> = {}) =>
      render(<ActionModal {...defaultProps} buttons={keyboardButtons} {...props} />);
    const pressTab = (shiftKey = false) =>
      fireEvent.keyDown(document.activeElement as Element, { key: "Tab", shiftKey });

    beforeEach(() => {
      mockOnClose.mockClear();
      document.addEventListener("keydown", documentListener);
    });
    afterEach(() => {
      document.removeEventListener("keydown", documentListener);
      documentListener.mockClear();
    });

    it("is an accessible modal dialog named by its title", () => {
      renderDialog();
      expect(screen.getByRole("dialog", { name: "Test Title" })).toHaveAttribute("aria-modal", "true");
    });

    it("focuses the first action when it opens", () => {
      renderDialog();
      expect(screen.getByText(YES)).toHaveFocus();
    });

    it("wraps Tab and Shift+Tab at the dialog edges", () => {
      renderDialog();
      screen.getByText(NO).focus();

      pressTab();
      expect(screen.getByLabelText("common.close")).toHaveFocus();
      pressTab(true);
      expect(screen.getByText(NO)).toHaveFocus();
    });

    it("lets the browser move Tab between inner buttons", () => {
      renderDialog();

      expect(pressTab()).toBe(true);
    });

    it("brings the focus back from outside the dialog", () => {
      renderDialog();
      (document.activeElement as HTMLElement).blur();

      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });

      expect(screen.getByLabelText("common.close")).toHaveFocus();
    });

    it("keeps Tab on the dialog when nothing can be focused", () => {
      renderDialog({ isLoading: true });

      const event = fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });

      expect(event).toBe(false);
    });

    it("closes with Escape unless it is loading", () => {
      const { rerender } = renderDialog();
      fireEvent.keyDown(screen.getByText(YES), { key: "Escape" });
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      rerender(<ActionModal {...defaultProps} buttons={keyboardButtons} isLoading />);
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("keeps its keys away from the page shortcuts", () => {
      renderDialog();

      fireEvent.keyDown(screen.getByText(YES), { key: "Enter" });

      expect(documentListener).not.toHaveBeenCalled();
    });
  });
});
