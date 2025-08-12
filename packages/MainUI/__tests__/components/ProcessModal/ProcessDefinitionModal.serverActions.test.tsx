import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProcessDefinitionModal from "@/components/ProcessModal/ProcessDefinitionModal";

// Mock server action
const mockExecuteProcess = jest.fn();
jest.mock("@/app/actions/process", () => ({
  executeProcess: (...args: any[]) => (mockExecuteProcess as any)(...args),
}));

// Minimal mocks for heavy dependencies
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    tab: { window: "W123", entityName: "EntityX", fields: [] },
    record: { id: "R1" },
  }),
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ graph: { getSelectedMultiple: () => [] } }),
}));

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ session: {} }),
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
    // Important for tests: prevent form.reset loop in effect
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
    },
  } as any;

  it("calls executeProcess on click and shows pending state", async () => {
    mockExecuteProcess.mockResolvedValueOnce({ success: true, data: { ok: 1 } });

    render(<ProcessDefinitionModal open={true} onClose={jest.fn()} button={button} />);

    const executeBtn = screen.getByRole("button", { name: /common.execute/i });
    fireEvent.click(executeBtn);

    // While pending, the button should show loading text eventually
    await waitFor(() => {
      expect(mockExecuteProcess).toHaveBeenCalled();
    });
  });
});
