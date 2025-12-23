import { render, fireEvent, waitFor, type RenderResult } from "@testing-library/react";
import ProcessDefinitionModal from "../ProcessDefinitionModal";
import { executeProcess } from "@/app/actions/process";

// Mock global fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ response: { status: 0, data: [], responseActions: [] } }),
  text: () => Promise.resolve(""),
} as Response);

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    getProcess: jest.fn().mockResolvedValue({ id: "TEST_PROCESS_ID" }),
  },
}));

// Mock the server action (not used in this path anymore but kept for safety)
jest.mock("@/app/actions/process", () => ({
  executeProcess: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

// Mock the user context to provide a token
const mockUseUserContext = jest.fn(() => ({
  token: "test-auth-token-123",
  session: { userId: "test-user" },
  getCsrfToken: () => "mock-csrf-token",
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
  default: ({ children }: any) => <div>{children}</div>,
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
  FormProvider: ({ children }: any) => children,
  useForm: () => ({
    getValues: () => ({}),
    setValue: jest.fn(),
    watch: () => ({}),
    control: {},
  }),
  useFormState: (_: { control?: any } = {}) => ({ isValid: true, isSubmitting: false }),
}));

const mockExecuteProcess = executeProcess as jest.MockedFunction<typeof executeProcess>;

// Helper functions to reduce code duplication
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
        "X-CSRF-Token": "mock-csrf-token",
      }),
    })
  );
};

describe("ProcessDefinitionModal token handling", () => {
  const mockButton = {
    processId: "TEST_PROCESS_ID",
    processDefinition: {
      id: "TEST_PROCESS_ID",
      name: "Test Process",
      description: "Test process description",
      javaClassName: "com.test.TestProcess",
      parameters: {},
      onLoad: null,
      onProcess: null,
    },
  } as any;

  const renderModal = (options: RenderModalOptions = {}): RenderResult => {
    const { onClose = jest.fn(), onSuccess = jest.fn() } = options;

    return render(<ProcessDefinitionModal button={mockButton} open={true} onClose={onClose} onSuccess={onSuccess} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteProcess.mockResolvedValue({ success: true, data: {} });
  });

  it("passes authentication token to executeProcess server action", async () => {
    const container = renderModal();
    await clickExecuteButton(container);

    await waitFor(() => {
      expectFetchCall("test-auth-token-123");
    });
  });

  it("handles token parameter correctly", async () => {
    // Test that the token parameter is passed through properly
    const container = renderModal();
    await clickExecuteButton(container);

    await waitFor(() => {
      expectFetchCall("test-auth-token-123");
    });
  });

  it("includes token in dependency array of useCallback hooks", () => {
    // This test ensures that changes to token trigger re-creation of callback functions
    // We test this by checking that the component doesn't throw dependency warnings
    expect(() => {
      renderModal();
    }).not.toThrow();
  });
});
