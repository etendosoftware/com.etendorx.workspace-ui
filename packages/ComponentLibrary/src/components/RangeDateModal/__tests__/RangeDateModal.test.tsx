import { render, screen, fireEvent } from "@testing-library/react";
import DateRangeModal from "../RangeDateModal";

// RangeDateModal uses createPortal - jsdom supports this
const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
};

describe("DateRangeModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when isOpen is false", () => {
    const { container } = render(<DateRangeModal isOpen={false} onClose={jest.fn()} onConfirm={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when isOpen is true", () => {
    render(<DateRangeModal {...defaultProps} />);
    // Modal renders through portal into document.body
    expect(document.body.textContent).toBeTruthy();
  });

  it("renders the modal title", () => {
    render(<DateRangeModal {...defaultProps} />);
    expect(document.body).toHaveTextContent("Select dates");
  });

  it("renders From and To labels", () => {
    render(<DateRangeModal {...defaultProps} />);
    expect(document.body).toHaveTextContent("From");
    expect(document.body).toHaveTextContent("To");
  });

  it("renders Cancel and Confirm buttons", () => {
    render(<DateRangeModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = jest.fn();
    render(<DateRangeModal isOpen={true} onClose={onClose} onConfirm={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Confirm is clicked", () => {
    const onConfirm = jest.fn();
    render(<DateRangeModal isOpen={true} onClose={jest.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith(null, null);
  });

  it("uses custom translation function when provided", () => {
    const t = jest.fn((key: string) => `translated:${key}`);
    render(<DateRangeModal {...defaultProps} t={t} />);
    expect(t).toHaveBeenCalled();
  });

  it("renders month navigation buttons", () => {
    render(<DateRangeModal {...defaultProps} />);
    // Should have prev/next month navigation
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(2);
  });

  it("renders with initial start date", () => {
    const startDate = new Date(2024, 0, 15);
    render(<DateRangeModal {...defaultProps} initialStartDate={startDate} />);
    expect(document.body).toHaveTextContent("From");
  });

  it("renders clear filters button", () => {
    render(<DateRangeModal {...defaultProps} />);
    expect(document.body).toHaveTextContent("Clear filters");
  });
});
