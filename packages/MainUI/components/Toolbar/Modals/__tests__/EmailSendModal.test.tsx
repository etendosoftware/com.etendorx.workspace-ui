import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EmailSendModal from "../EmailSendModal";
import "@testing-library/jest-dom";

// Mock translation hook
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Modal component
jest.mock("../../../Modal", () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="mock-modal">{children}</div> : null,
}));

// Mock Button component
jest.mock("../../../../../ComponentLibrary/src/components/Button/Button", () => ({
  __esModule: true,
  default: ({ children, onClick, type, disabled, form }: any) => (
    <button onClick={onClick} type={type} disabled={disabled} form={form}>
      {children}
    </button>
  ),
}));

// Mock Icons
jest.mock("../../../../../ComponentLibrary/src/assets/icons/x.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="close-icon" />,
}));
jest.mock("../../../../../ComponentLibrary/src/assets/icons/chevron-down.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="chevron-down-icon" />,
}));

describe("EmailSendModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSend = jest.fn().mockResolvedValue(undefined);
  const initialData = {
    to: "test@example.com",
    toName: "Test User",
    subject: "Test Subject",
    body: "Test Body",
    templates: [
      { id: "1", name: "Template 1" },
      { id: "2", name: "Template 2" },
    ],
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSend: mockOnSend,
    loading: false,
    initialData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with initial data", () => {
    render(<EmailSendModal {...defaultProps} />);

    expect(screen.getByLabelText("email.to")).toHaveValue("test@example.com");
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByLabelText("email.subject")).toHaveValue("Test Subject");
    expect(screen.getByDisplayValue("Test Body")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<EmailSendModal {...defaultProps} />);

    // The close button in the header has aria-label="Close"
    const closeButtons = screen.getAllByLabelText("Close");
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", () => {
    render(<EmailSendModal {...defaultProps} />);

    const cancelButton = screen.getByText("common.cancel");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("toggles more fields when clicking the link", () => {
    render(<EmailSendModal {...defaultProps} />);

    // Initially CC is not visible
    expect(screen.queryByLabelText("email.cc")).not.toBeInTheDocument();

    const toggleLink = screen.getByText(/email.showMoreFields/);
    fireEvent.click(toggleLink);

    // Now CC should be visible
    expect(screen.getByLabelText("email.cc")).toBeInTheDocument();

    // Click again to hide
    const hideLink = screen.getByText(/email.hideFields/);
    fireEvent.click(hideLink);

    expect(screen.queryByLabelText("email.cc")).not.toBeInTheDocument();
  });

  it("submits the form with correct data", async () => {
    const { container } = render(<EmailSendModal {...defaultProps} />);
    const form = container.querySelector("#email-form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "Test Subject",
          body: "Test Body",
        }),
        [],
        []
      );
    });
  });

  it("shows validation error if required fields are empty", async () => {
    const propsWithoutRequired = {
      ...defaultProps,
      initialData: { ...initialData, to: "", subject: "" },
    };

    render(<EmailSendModal {...propsWithoutRequired} />);

    const sendButton = screen.getByText("email.send");
    fireEvent.click(sendButton);

    await waitFor(() => {
      // Check for validation error indicator (border-red-400 class)
      const toInput = screen.getByLabelText("email.to");
      const subjectInput = screen.getByLabelText("email.subject");

      expect(toInput).toHaveClass("border-red-400");
      expect(subjectInput).toHaveClass("border-red-400");
    });

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it("disables buttons when loading is true", () => {
    render(<EmailSendModal {...defaultProps} loading={true} />);

    const sendButton = screen.getByText("email.sending");
    const cancelButton = screen.getByText("common.cancel");

    expect(sendButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});
