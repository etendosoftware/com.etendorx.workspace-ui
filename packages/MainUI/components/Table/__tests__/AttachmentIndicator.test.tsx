import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AttachmentIndicator } from "../AttachmentIndicator";
import { useAttachmentContext } from "@/contexts/AttachmentContext";

// Mock the context hook
jest.mock("@/contexts/AttachmentContext", () => ({
  useAttachmentContext: jest.fn(),
}));

// Mock SVG
jest.mock("@workspaceui/componentlibrary/src/assets/icons/paperclip.svg", () => {
  return (props) => <div data-testid="paperclip-icon" {...props} />;
});

const NO_ATTACHMENTS = { attachmentExists: false, attachmentCount: 0 };
const RECORD_ID = "record1";
const TAB_ID = "tab1";

describe("AttachmentIndicator", () => {
  const mockFetchAttachmentInfo = jest.fn();
  const mockOnClick = jest.fn();

  const defaultProps = {
    record: { id: RECORD_ID },
    tab: { id: TAB_ID, window: "window1" },
    onClick: mockOnClick,
  };

  const mockAttachments = (value: typeof NO_ATTACHMENTS) => {
    mockFetchAttachmentInfo.mockResolvedValue(value);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAttachmentContext as jest.Mock).mockReturnValue({
      fetchAttachmentInfo: mockFetchAttachmentInfo,
    });
  });

  it("should render without attachments initially", () => {
    mockAttachments(NO_ATTACHMENTS);

    render(<AttachmentIndicator {...defaultProps} />);

    // Check loading/initial state
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should fetch attachment info on mount", async () => {
    mockAttachments(NO_ATTACHMENTS);

    render(<AttachmentIndicator {...defaultProps} />);

    expect(mockFetchAttachmentInfo).toHaveBeenCalledWith(defaultProps.record, defaultProps.tab);
  });

  it("should display badge when attachments exist", async () => {
    mockAttachments({ attachmentExists: true, attachmentCount: 3 });

    render(<AttachmentIndicator {...defaultProps} />);

    await waitFor(() => {
      // Badge content should be visible
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "3 attachment(s)");
  });

  it("should display dimmed icon when no attachments", async () => {
    mockAttachments(NO_ATTACHMENTS);

    render(<AttachmentIndicator {...defaultProps} />);

    await waitFor(() => {
      const icon = screen.getByTestId("paperclip-icon-no-badge");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("opacity-30");
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "No attachments");
  });

  it("should call onClick handler when clicked", async () => {
    mockAttachments(NO_ATTACHMENTS);

    render(<AttachmentIndicator {...defaultProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
