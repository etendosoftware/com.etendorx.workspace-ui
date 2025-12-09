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
      { label: "Button 1", onClick: jest.fn(), variant: "primary" as const },
      { label: "Button 2", onClick: jest.fn(), variant: "secondary" as const },
    ];
    render(<ActionModal {...defaultProps} buttons={buttons} />);
    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
  });

  it("calls button onClick handler when clicked", () => {
    const mockOnClick = jest.fn();
    const buttons = [{ label: "Action Button", onClick: mockOnClick, variant: "primary" as const }];
    render(<ActionModal {...defaultProps} buttons={buttons} />);
    fireEvent.click(screen.getByText("Action Button"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("shows loading overlay when isLoading is true", () => {
    const { container } = render(<ActionModal {...defaultProps} isLoading={true} />);
    const closeButton = screen.getByLabelText("common.close");
    expect(closeButton).toBeDisabled();
  });

  it("disables buttons when isLoading is true", () => {
    const buttons = [{ label: "Action Button", onClick: jest.fn(), variant: "primary" as const }];
    render(<ActionModal {...defaultProps} buttons={buttons} isLoading={true} />);
    expect(screen.getByText("Action Button")).toBeDisabled();
  });
});
