import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Toolbar } from "../Toolbar";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecord } from "@/hooks/useSelectedRecord";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { useUserContext } from "@/hooks/useUserContext";
import { useToolbar } from "@/hooks/Toolbar/useToolbar";
import { useTranslation } from "@/hooks/useTranslation";
import "@testing-library/jest-dom";

// Mocks
jest.mock("@/contexts/datasourceContext", () => ({
  useDatasourceContext: () => ({ refetchDatasource: jest.fn() }),
}));
jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn(),
}));
jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({
    saveButtonState: {},
    isImplicitFilterApplied: false,
    isAdvancedFilterApplied: false,
  }),
}));
jest.mock("@/hooks/useSelected", () => require("../__testUtils__/toolbarMocks").UseSelectedMock);
jest.mock("@/contexts/window", () => require("../__testUtils__/toolbarMocks").WindowContextMock);
jest.mock("@/hooks/Toolbar/useProcessExecution", () => ({
  useProcessExecution: () => ({ executeProcess: jest.fn() }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: jest.fn(),
}));
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: jest.fn(),
}));
jest.mock("@/hooks/useSelectedRecord", () => ({
  useSelectedRecord: jest.fn(),
}));
jest.mock("@/hooks/useSelectedRecords", () => ({
  useSelectedRecords: jest.fn(),
}));
jest.mock("@/hooks/Toolbar/useToolbar", () => ({
  useToolbar: jest.fn(),
}));
jest.mock("@/hooks/Toolbar/useToolbarConfig", () => ({
  useToolbarConfig: () => ({
    handleAction: jest.fn(),
    actionModal: { isOpen: false },
  }),
}));
jest.mock("@/hooks/Toolbar/useProcessButton", () => ({
  useProcessButton: () => ({ handleProcessClick: jest.fn() }),
}));

jest.mock(
  "@workspaceui/componentlibrary/src/components/IconButton",
  () => require("../__testUtils__/toolbarMocks").IconButtonMock
);
jest.mock(
  "@workspaceui/componentlibrary/src/components/IconButtonWithText",
  () => require("../__testUtils__/toolbarMocks").IconButtonWithTextMock
);

// Mock EmailSendModal
jest.mock("../Modals/EmailSendModal", () => ({
  __esModule: true,
  default: ({ isOpen, onSend, initialData }: any) =>
    isOpen ? (
      <div data-testid="email-modal">
        <button onClick={() => onSend({ to: "test@test.com" }, [], [])}>Send Action</button>
        {initialData?.to && <span>To: {initialData.to}</span>}
      </div>
    ) : null,
}));

// Mock other modals to avoid server-side imports
jest.mock("../../ProcessModal/ProcessDefinitionModal", () => ({
  __esModule: true,
  default: () => <div data-testid="process-definition-modal" />,
}));
jest.mock("../../ProcessModal/Iframe", () => ({
  __esModule: true,
  default: () => <div data-testid="process-iframe-modal" />,
}));
jest.mock("@workspaceui/componentlibrary/src/components/ActionModal", () => ({
  __esModule: true,
  default: () => <div data-testid="action-modal" />,
}));
jest.mock("@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal", () => ({
  __esModule: true,
  default: () => <div data-testid="confirm-modal" />,
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// The email button as it comes from the backend for Invoice/Order entities
const mockEmailButton = {
  id: "send-email",
  action: "SEND_MAIL",
  name: "Send Email",
  section: "right" as const,
  buttonType: "ACTION" as const,
  active: true,
  windows: [],
};

describe("Toolbar - Email Integration", () => {
  const mockToken = "test-token";
  const mockTab = { id: "tab-id", entityName: "Invoice" };
  const mockRecord = { id: "record-id" };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: (k: string) => k });
    (useUserContext as jest.Mock).mockReturnValue({ token: mockToken, session: {} });
    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab });
    (useSelectedRecord as jest.Mock).mockReturnValue(mockRecord);
    (useSelectedRecords as jest.Mock).mockReturnValue([mockRecord]);
    (useToolbar as jest.Mock).mockReturnValue({
      buttons: [mockEmailButton],
      processButtons: [],
      loading: false,
      refetch: jest.fn(),
    });

    global.fetch = jest.fn();
  });

  it("renders email button when entity is Invoice", () => {
    render(<Toolbar windowId="win-id" isFormView={true} />);
    expect(screen.getByTestId("IconButton__send-email")).toBeInTheDocument();
  });

  it("does not render email button when entity is not Invoice/Order", () => {
    (useTabContext as jest.Mock).mockReturnValue({ tab: { id: "tab-id", entityName: "Product" } });
    (useToolbar as jest.Mock).mockReturnValue({
      buttons: [],
      processButtons: [],
      loading: false,
      refetch: jest.fn(),
    });
    render(<Toolbar windowId="win-id" isFormView={true} />);
    expect(screen.queryByTestId("IconButton__send-email")).not.toBeInTheDocument();
  });

  it("opens email modal and fetches config when email button is clicked", async () => {
    const mockEmailConfig = {
      to: "client@example.com",
      subject: "Test Invoice",
      success: true,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEmailConfig),
    });

    render(<Toolbar windowId="win-id" isFormView={true} />);

    const emailButton = screen.getByTestId("IconButton__send-email");
    fireEvent.click(emailButton);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/erp/meta/email/config"), expect.anything());

    await waitFor(() => {
      expect(screen.getByTestId("email-modal")).toBeInTheDocument();
      expect(screen.getByText("To: client@example.com")).toBeInTheDocument();
    });
  });

  it("sends email and shows success toast", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/erp/meta/email/config")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ to: "test@test.com", success: true }),
        });
      }
      if (url.includes("/api/erp/meta/email/attachments")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url.includes("/api/erp/meta/email/send")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<Toolbar windowId="win-id" isFormView={true} />);

    fireEvent.click(screen.getByTestId("IconButton__send-email"));

    await waitFor(() => screen.getByTestId("email-modal"));

    fireEvent.click(screen.getByText("Send Action"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/erp/meta/email/send"),
        expect.objectContaining({ method: "POST" })
      );
      const { toast } = require("sonner");
      expect(toast.success).toHaveBeenCalledWith("email.successMessage");
      expect(screen.queryByTestId("email-modal")).not.toBeInTheDocument();
    });
  });
});
