import { render, fireEvent, waitFor, type RenderResult } from "@testing-library/react";
import ProcessDefinitionModal from "../ProcessDefinitionModal";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import React from "react";

// Mock executeStringFunction to return proper response structure
const mockExecuteStringFunction = jest.fn().mockResolvedValue({
  responseActions: [
    {
      showMsgInProcessView: {
        msgType: "success",
        msgText: "Process executed successfully",
      },
    },
  ],
});

jest.mock("@/utils/functions", () => ({
  executeStringFunction: (...args: unknown[]) => mockExecuteStringFunction(...args),
}));

// Mock global fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true, response: { status: 0, data: [], responseActions: [] } }),
  text: () => Promise.resolve(""),
} as Response);

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    getProcess: jest.fn().mockResolvedValue({ id: "TEST_PROCESS_ID" }),
    client: {
      post: jest.fn().mockResolvedValue({ ok: true, data: { parameters: [] } }),
    },
  },
}));

// Mock the server action (not used in this path anymore but kept for safety)
jest.mock("@/app/actions/process", () => ({
  executeProcess: jest.fn(),
}));

// Mock the revalidate server action (next/cache is not available in Jest)
jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock the user context to provide a token
const mockUseUserContext = jest.fn(() => ({
  token: "test-auth-token-123",
  session: { userId: "test-user" },
  getCsrfToken: () => "test-csrf-token",
}));

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => mockUseUserContext(),
}));

// Mock other dependencies
jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    tab: {
      id: "test-tab",
      window: "test-window",
      entityName: "TestEntity",
      fields: [],
    },
    record: { id: "test-record" },
  }),
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({
    graph: {
      getSelectedMultiple: jest.fn(() => []),
    },
  }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useProcessInitialization", () => ({
  useProcessInitialization: () => ({
    initializeProcess: jest.fn(),
    loading: false,
    availableFormData: {},
    recordValues: {},
  }),
}));

jest.mock("@/hooks/useProcessInitialState", () => ({
  useProcessInitializationState: () => ({
    initialState: {},
    logicFields: {},
    filterExpressions: {},
    refreshParent: false,
    hasData: false,
  }),
}));

jest.mock("@/hooks/datasource/useProcessDatasourceConfig", () => ({
  useProcessConfig: () => ({ fetchConfig: jest.fn(), loading: false, error: null, config: {} }),
}));

jest.mock("@/utils/processes/definition/constants", () => ({
  PROCESS_DEFINITION_DATA: {
    TEST_PROCESS_ID: {
      inpPrimaryKeyColumnId: "testPrimaryKey",
      inpColumnId: "testColumn",
      additionalPayloadFields: [],
    },
  },
  WINDOW_SPECIFIC_KEYS: {},
  PROCESS_TYPES: {
    PROCESS_DEFINITION: "process-definition",
    REPORT_AND_PROCESS: "report-and-process",
  },
  BUTTON_LIST_REFERENCE_ID: "FF80818132F94B500132F9575619000A",
}));

// Mock useProcessCallouts hook
jest.mock("@/components/ProcessModal/callouts/useProcessCallouts", () => ({
  useProcessCallouts: jest.fn(),
}));

jest.mock("@/components/ProcessModal/selectors/ProcessParameterSelector", () => ({
  __esModule: true,
  default: () => <div data-testid="param-selector">param</div>,
}));

jest.mock("@/components/ProcessModal/WindowReferenceGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="window-grid">grid</div>,
}));

jest.mock("@/components/Modal", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/loading", () => ({
  __esModule: true,
  default: () => <div data-testid="loading">loading</div>,
}));

jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
    startIcon,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    startIcon?: React.ReactNode;
    className?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {startIcon}
      {children}
    </button>
  ),
}));

jest.mock("react-hook-form", () => ({
  FormProvider: ({ children }: { children: React.ReactNode }) => children,
  useForm: () => ({
    getValues: () => ({}),
    setValue: jest.fn(),
    watch: () => ({}),
    control: {},
    reset: jest.fn(),
  }),
  useFormState: (_: { control?: unknown } = {}) => ({ isValid: true, isSubmitting: false }),
}));

// Mock Revalidate
jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn().mockResolvedValue(true),
}));

interface RenderModalOptions {
  onClose?: jest.Mock;
  onSuccess?: jest.Mock;
}

const clickExecuteButton = async (container: RenderResult): Promise<void> => {
  const executeButton = container.getByText("common.execute");
  fireEvent.click(executeButton);
};

const expectFetchCall = (expectedToken: string) => {
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/erp/org.openbravo.client.kernel"),
    expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        Authorization: `Bearer ${expectedToken}`,
        "X-CSRF-Token": "test-csrf-token",
      }),
    })
  );
};

describe("ProcessDefinitionModal Execution Flows", () => {
  const mockClose = jest.fn();
  const mockSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderModal = (button: any) => {
    return render(<ProcessDefinitionModal button={button} open={true} onClose={mockClose} onSuccess={mockSuccess} />);
  };

  test("Direct Java Process Execution (no onProcess, javaClassName present)", async () => {
    const directJavaButton = {
      name: "Java Process",
      processDefinition: {
        id: "TEST_PROCESS_ID",
        name: "Test Java Process",
        javaClassName: "com.test.TestProcess",
        parameters: {},
        onProcess: null, // No JS handler
      },
    };

    const container = renderModal(directJavaButton);
    await clickExecuteButton(container);

    await waitFor(() => {
      // Should call fetch directly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/erp/org.openbravo.client.kernel"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringMatching(/test-record/),
        })
      );
    });
  });

  test("Report Process Execution (Polling)", async () => {
    // Mock the initial POST to report-and-process
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ pInstanceId: "TEST_PINSTANCE_ID" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ isProcessing: false, result: 1, errorMsg: "Success" }),
      } as Response); // Status check mock

    const reportButton = {
      name: "Report Process",
      processDefinition: {
        id: "TEST_REPORT_ID",
        name: "Test Report",
        parameters: {},
      },
      type: "report-and-process", // Important check type
    };

    // Need to pass type prop which comes from ProcessDefinitionModalProps
    // The ProcessDefinitionModal passes props to Content.
    // However, `type` is not in the button structure usually, it's a separate prop
    // Let's modify renderModal to accept props
    const container = render(
      <ProcessDefinitionModal
        button={reportButton}
        open={true}
        onClose={mockClose}
        onSuccess={mockSuccess}
        type="report-and-process"
      />
    );

    const executeButton = container.getByText("common.execute");
    fireEvent.click(executeButton);

    await waitFor(() => {
      // First call: execute
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/process/report-and-process",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    await waitFor(() => {
      // Second call: poll status
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/process/report-and-process/TEST_PINSTANCE_ID"),
        expect.anything()
      );
    });
  });
});
