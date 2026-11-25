import { render, screen, fireEvent } from "@testing-library/react";
import DateRangeModal from "../RangeDateModal";
import { formatBrowserDate } from "../../../utils/dateFormatter";
import { DATE_FILTER_MODE } from "../dateFilterSelection";

const { SINGLE, RANGE } = DATE_FILTER_MODE;
const JAN_10_2024 = new Date(2024, 0, 10);
// ISO text is read the same way in every browser locale
const TYPED_MARCH_5 = "2027-03-05";
const MARCH_5 = new Date(2027, 2, 5);

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

  it("renders From and To labels in range mode", () => {
    render(<DateRangeModal {...defaultProps} initialMode={RANGE} />);
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
    expect(onConfirm).toHaveBeenCalledWith(null, null, SINGLE);
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
    render(<DateRangeModal {...defaultProps} initialMode={RANGE} initialStartDate={startDate} />);
    expect(document.body).toHaveTextContent("From");
  });

  it("renders clear filters button", () => {
    render(<DateRangeModal {...defaultProps} />);
    expect(document.body).toHaveTextContent("Clear filters");
  });

  describe("one date and range modes", () => {
    const renderModal = (props: Partial<React.ComponentProps<typeof DateRangeModal>> = {}) => {
      const onConfirm = jest.fn();
      render(<DateRangeModal {...defaultProps} onConfirm={onConfirm} initialStartDate={JAN_10_2024} {...props} />);
      return onConfirm;
    };
    const clickDay = (day: string) => fireEvent.click(screen.getByRole("button", { name: day }));
    const confirm = () => fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    const typeDate = (index: number, text: string) => {
      const input = screen.getAllByRole("textbox")[index];
      fireEvent.change(input, { target: { value: text } });
      fireEvent.blur(input);
    };

    it("opens in one-date mode with a single date field", () => {
      renderModal({ initialStartDate: undefined });
      expect(screen.getByRole("button", { name: "One date" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getAllByRole("textbox")).toHaveLength(1);
      expect(document.body).toHaveTextContent("Date");
      expect(document.body).toHaveTextContent("No date filter");
    });

    it("filters one day with a single click", () => {
      const onConfirm = renderModal();
      clickDay("15");
      expect(document.body).toHaveTextContent(`Filters: ${formatBrowserDate(new Date(2024, 0, 15))}`);
      confirm();
      expect(onConfirm).toHaveBeenCalledWith(new Date(2024, 0, 15), null, SINGLE);
    });

    it("chooses a range in range mode", () => {
      const onConfirm = renderModal();
      fireEvent.click(screen.getByRole("button", { name: "Range" }));
      expect(screen.getAllByRole("textbox")).toHaveLength(2);
      clickDay("20");
      confirm();
      expect(onConfirm).toHaveBeenCalledWith(JAN_10_2024, new Date(2024, 0, 20), RANGE);
    });

    it("applies a typed date and moves the calendar to its month", () => {
      const onConfirm = renderModal();
      typeDate(0, TYPED_MARCH_5);
      const [monthSelect, yearSelect] = screen.getAllByRole("combobox");
      expect(monthSelect).toHaveValue("2");
      expect(yearSelect).toHaveValue("2027");
      expect(screen.getByRole("textbox")).toHaveValue(formatBrowserDate(MARCH_5));
      confirm();
      expect(onConfirm).toHaveBeenCalledWith(MARCH_5, null, SINGLE);
    });

    it("applies a typed date with Enter", () => {
      renderModal();
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: TYPED_MARCH_5 } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(input).toHaveValue(formatBrowserDate(MARCH_5));
    });

    it("reports an invalid typed date and does not allow to confirm it", () => {
      const onConfirm = renderModal();
      typeDate(0, "31/02/2026");
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid date");
      expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
      confirm();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("types both ends of a range", () => {
      const onConfirm = renderModal({ initialMode: RANGE, initialStartDate: undefined });
      typeDate(0, "2027-03-01");
      typeDate(1, TYPED_MARCH_5);
      confirm();
      expect(onConfirm).toHaveBeenCalledWith(new Date(2027, 2, 1), MARCH_5, RANGE);
    });

    it("clears a date with its clear button", () => {
      renderModal();
      const input = screen.getByRole("textbox");
      fireEvent.click(input.parentElement?.querySelector("button") as HTMLButtonElement);
      expect(input).toHaveValue("");
      expect(document.body).toHaveTextContent("No date filter");
    });
  });
});
