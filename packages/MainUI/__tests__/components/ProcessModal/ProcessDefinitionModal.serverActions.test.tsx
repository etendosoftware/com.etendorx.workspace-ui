import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProcessDefinitionModal from "@/components/ProcessModal/ProcessDefinitionModal";
import { revalidateDopoProcess } from "@/app/actions/revalidate";

// Mock global fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true, data: {} }),
  text: () => Promise.resolve(""),
  headers: new Headers(),
} as Response);

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: {
    getProcess: jest.fn().mockResolvedValue({ id: "P123" }),
  },
}));

// Mock server action
const mockExecuteProcess = jest.fn();
jest.mock("@/app/actions/process", () => ({
  executeProcess: (...args: unknown[]) => mockExecuteProcess(...args),
}));

// Mock the revalidate server action (next/cache is not available in Jest)
jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock executeStringFunction
jest.mock("@/utils/functions", () => ({
  executeStringFunction: jest.fn().mockResolvedValue({
    responseActions: [
      {
        showMsgInProcessView: {
          msgType: "success",
          msgText: "Process executed successfully",
        },
      },
    ],
  }),
}));

// Mock useProcessCallouts hook
jest.mock("@/components/ProcessModal/callouts/useProcessCallouts", () => ({
  useProcessCallouts: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn(),
}));

// Mock the process definition constants
jest.mock("@/utils/processes/definition/constants", () => ({
  PROCESS_DEFINITION_DATA: {},
  WINDOW_SPECIFIC_KEYS: {},
  PROCESS_TYPES: {
    PROCESS_DEFINITION: "process-definition",
    REPORT_AND_PROCESS: "report-and-process",
  },
  BUTTON_LIST_REFERENCE_ID: "FF80818132F94B500132F9575619000A",
}));

// Minimal mocks for heavy dependencies
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    tab: {
      window: "W123",
      entityName: "EntityX",
      fields: {},
      id: "T1",
    },
    record: { id: "R1" },
  }),
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ graph: { getSelectedMultiple: () => [] } }),
}));

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ session: {}, token: "mock-token", getCsrfToken: () => "mock-csrf-token" }),
}));

jest.mock("@/hooks/datasource/useProcessDatasourceConfig", () => ({
  useProcessConfig: () => ({ fetchConfig: jest.fn(), loading: false, error: null, config: {} }),
}));

jest.mock("@/contexts/window", () => ({
  useWindowContext: () => ({
    triggerRecovery: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/hooks/useProcessInitialization", () => ({
  useProcessInitialization: () => ({ processInitialization: {}, loading: false, error: null, refetch: jest.fn() }),
}));

jest.mock("@/hooks/useProcessInitialState", () => ({
  useProcessInitializationState: () => ({
    initialState: {},
    logicFields: {},
    filterExpressions: {},
    refreshParent: false,
    // Set to false to prevent form.reset loops
    hasData: false,
  }),
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

describe("ProcessDefinitionModal - Server Actions path", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const button = {
    name: "Test Process",
    processDefinition: {
      id: "P123",
      javaClassName: "com.test.Demo",
      parameters: {},
      onLoad: "",
      onProcess: "",
    },
  } as any;

  it("renders modal with process name", async () => {
    render(<ProcessDefinitionModal open={true} onClose={jest.fn()} button={button} />);

    // Verify the modal renders with the process name (synchronously)
    expect(screen.getByText("Test Process")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    render(<ProcessDefinitionModal open={true} onClose={jest.fn()} button={button} />);

    // Verify loading indicator is present (synchronously)
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("executes process via fetch and revalidates on success", async () => {
    render(<ProcessDefinitionModal open={true} onClose={jest.fn()} button={button} />);

    // Wait for the button to be available (loading to finish)
    // Our mocks return loading: false for hooks, so it should be immediate,
    // but the component has some internal state loading.
    // The "Execute" button has testid="ExecuteButton__761503"

    // We need to wait for internal loading state to settle if any
    const executeBtn = await screen.findByTestId("ExecuteButton__761503");
    expect(executeBtn).toBeInTheDocument();

    // Ensure it's not disabled (wait if needed)
    await waitFor(() => expect(executeBtn).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(executeBtn);
    });

    // Check if fetch was called with correct URL and headers
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/erp/org.openbravo.client.kernel"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
            "X-CSRF-Token": "mock-csrf-token",
          }),
        })
      );
    });

    // Check if revalidate action was called
    await waitFor(() => {
      expect(revalidateDopoProcess).toHaveBeenCalled();
    });
  });
});
