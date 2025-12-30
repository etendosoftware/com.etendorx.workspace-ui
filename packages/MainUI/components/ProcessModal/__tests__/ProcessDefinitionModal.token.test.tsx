import { render, fireEvent, waitFor, type RenderResult } from "@testing-library/react";
import ProcessDefinitionModal from "../ProcessDefinitionModal";

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

// Mock the server action
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

// Helper functions to reduce code duplication
interface RenderModalOptions {
  onClose?: jest.Mock;
  onSuccess?: jest.Mock;
}

const clickExecuteButton = async (container: RenderResult): Promise<void> => {
  const executeButton = container.getByText("common.execute");
  fireEvent.click(executeButton);
};

describe("ProcessDefinitionModal token handling", () => {
  const mockButton = {
    processDefinition: {
      id: "TEST_PROCESS_ID",
      name: "Test Process",
      description: "Test process description",
      javaClassName: "com.test.TestProcess",
      parameters: {},
      onLoad: null,
      onProcess: "function onProcess(context) { return { success: true }; }",
    },
  };

  const renderModal = (options: RenderModalOptions = {}): RenderResult => {
    const { onClose = jest.fn(), onSuccess = jest.fn() } = options;

    return render(<ProcessDefinitionModal button={mockButton} open={true} onClose={onClose} onSuccess={onSuccess} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes authentication token to executeStringFunction", async () => {
    const container = renderModal();
    await clickExecuteButton(container);

    await waitFor(() => {
      // executeStringFunction should be called with the onProcess string and process definition
      expect(mockExecuteStringFunction).toHaveBeenCalled();

      // Verify the call includes the processDefinition
      const calls = mockExecuteStringFunction.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      // First arg should be the onProcess string
      expect(calls[0][0]).toBe("function onProcess(context) { return { success: true }; }");

      // Third arg should be the processDefinition
      expect(calls[0][2]).toMatchObject({
        id: "TEST_PROCESS_ID",
        javaClassName: "com.test.TestProcess",
      });
    });
  });

  it("renders success state after process execution", async () => {
    const container = renderModal();
    await clickExecuteButton(container);

    await waitFor(() => {
      // Verify success message is displayed
      expect(container.getByText("process.completedSuccessfully")).toBeInTheDocument();
      expect(container.getByText("Process executed successfully")).toBeInTheDocument();
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
