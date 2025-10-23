import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProcessDefinitionModal from "@/components/ProcessModal/ProcessDefinitionModal";

// Mock server action
const mockExecuteProcess = jest.fn();
jest.mock("@/app/actions/process", () => ({
  executeProcess: (...args: any[]) => (mockExecuteProcess as any)(...args),
}));

// Mock the process definition constants
jest.mock("@/utils/processes/definition/constants", () => ({
  PROCESS_DEFINITION_DATA: {},
  WINDOW_SPECIFIC_KEYS: {},
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
  useUserContext: () => ({ session: {}, token: "mock-token" }),
}));

jest.mock("@/hooks/datasource/useProcessDatasourceConfig", () => ({
  useProcessConfig: () => ({ fetchConfig: jest.fn(), loading: false, error: null, config: {} }),
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

describe("ProcessDefinitionModal - Server Actions path", () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
});
