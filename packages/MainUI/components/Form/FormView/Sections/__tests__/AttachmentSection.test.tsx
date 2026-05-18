import { screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AttachmentSection from "../AttachmentSection";
import { fetchAttachments, deleteAttachment, downloadAttachment } from "@workspaceui/api-client/src/api/attachments";
import { renderWithTheme } from "../../../../../test-utils/test-theme-provider";

// Mock API client
jest.mock("@workspaceui/api-client/src/api/attachments", () => ({
  fetchAttachments: jest.fn(),
  createAttachment: jest.fn(),
  editAttachment: jest.fn(),
  deleteAttachment: jest.fn(),
  deleteAllAttachments: jest.fn(),
  downloadAttachment: jest.fn(),
  downloadAllAttachments: jest.fn(),
}));

// Mock IconButton to ensure data-testid is preserved
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({ onClick, children, "data-testid": testId, disabled, className }: any) => (
    <button onClick={onClick} data-testid={testId} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

// Mock translations
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock user context
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({
    session: { adOrgId: "org-123" },
    currentOrganization: { id: "org-123" },
  }),
}));

// Mock components
jest.mock("../AddAttachmentModal", () => ({
  AddAttachmentModal: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="mock-add-modal">
        <button onClick={onClose} data-testid="close-add-modal">
          Close
        </button>
      </div>
    ) : null,
}));

jest.mock("@workspaceui/componentlibrary/src/components/BasicModal", () => ({
  __esModule: true,
  default: ({ open, children, onClose }: any) =>
    open ? (
      <div data-testid="mock-preview-modal">
        {children}
        <button onClick={onClose} data-testid="close-preview-modal">
          Close
        </button>
      </div>
    ) : null,
}));

jest.mock("@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal", () => ({
  __esModule: true,
  default: ({ open, onConfirm, onCancel }: any) =>
    open ? (
      <div data-testid="mock-confirm-modal">
        <button onClick={onConfirm} data-testid="confirm-button">
          Confirm
        </button>
        <button onClick={onCancel} data-testid="cancel-button">
          Cancel
        </button>
      </div>
    ) : null,
}));

// Mock Icons
jest.mock("@workspaceui/componentlibrary/src/assets/icons/trash.svg", () => () => <div data-testid="trash-icon" />);
jest.mock("@workspaceui/componentlibrary/src/assets/icons/download.svg", () => () => (
  <div data-testid="download-icon" />
));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/edit-3.svg", () => () => <div data-testid="edit-icon" />);
jest.mock("@workspaceui/componentlibrary/src/assets/icons/paperclip.svg", () => () => (
  <div data-testid="attachment-icon" />
));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/upload.svg", () => () => <div data-testid="upload-icon" />);
jest.mock("@workspaceui/componentlibrary/src/assets/icons/file-plus.svg", () => () => (
  <div data-testid="file-plus-icon" />
));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/check.svg", () => () => <div data-testid="check-icon" />);
jest.mock("@workspaceui/componentlibrary/src/assets/icons/x.svg", () => () => <div data-testid="x-icon" />);

describe("AttachmentSection", () => {
  const defaultProps = {
    recordId: "rec-1",
    tabId: "tab-1",
    initialAttachmentCount: 1,
    isSectionExpanded: true,
    onAttachmentsChange: jest.fn(),
  };

  const mockAttachments = [
    {
      id: "att-1",
      name: "test-file.pdf",
      description: "Test description",
      createdBy$_identifier: "User 1",
      creationDate: "2023-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchAttachments as jest.Mock).mockResolvedValue(mockAttachments);
    (downloadAttachment as jest.Mock).mockResolvedValue(new Blob(["test"], { type: "application/pdf" }));
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => "mock-url");
    global.URL.revokeObjectURL = jest.fn();
  });

  it("renders loading state and then attachments", async () => {
    renderWithTheme(<AttachmentSection {...defaultProps} />);

    expect(screen.getByText("common.loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
    });
  });

  it("opens preview modal when attachment is clicked", async () => {
    renderWithTheme(<AttachmentSection {...defaultProps} />);

    const attachmentName = await screen.findByText("test-file.pdf");
    fireEvent.click(attachmentName);

    expect(screen.getByTestId("mock-preview-modal")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("shows delete confirmation and deletes attachment", async () => {
    (deleteAttachment as jest.Mock).mockResolvedValue({ success: true });

    renderWithTheme(<AttachmentSection {...defaultProps} />);

    await waitFor(() => screen.getByTestId("IconButton__delete_att-1"));
    const deleteButton = screen.getByTestId("IconButton__delete_att-1");
    fireEvent.click(deleteButton);

    expect(screen.getByTestId("mock-confirm-modal")).toBeInTheDocument();

    const confirmButton = screen.getByTestId("confirm-button");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentId: "att-1",
        })
      );
      expect(defaultProps.onAttachmentsChange).toHaveBeenCalled();
    });
  });

  it("opens add modal when a file is selected", async () => {
    renderWithTheme(<AttachmentSection {...defaultProps} />);

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const input = screen.getByTestId("Input__attachments_file");

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByTestId("mock-add-modal")).toBeInTheDocument();
  });

  it("does not fetch if initial count is 0", async () => {
    renderWithTheme(<AttachmentSection {...defaultProps} initialAttachmentCount={0} />);

    expect(fetchAttachments).not.toHaveBeenCalled();
    expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
  });
});
