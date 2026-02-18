import React from "react";
import { fireEvent, type RenderResult } from "@testing-library/react";

// Mock Data
export const mockExecuteStringFunctionResponse = {
  responseActions: [
    {
      showMsgInProcessView: {
        msgType: "success",
        msgText: "Process executed successfully",
      },
    },
  ],
};

export const mockFetchResponseOk = {
  ok: true,
  json: () => Promise.resolve({ success: true, response: { status: 0, data: [], responseActions: [] } }),
  text: () => Promise.resolve(""),
} as Response;

export const mockUserContextData = {
  token: "test-auth-token-123",
  session: { userId: "test-user" },
  getCsrfToken: () => "test-csrf-token",
};

export const mockTabContextData = {
  tab: {
    id: "test-tab",
    window: "test-window",
    entityName: "TestEntity",
    fields: [],
  },
  record: { id: "test-record" },
};

export const mockSelectedData = {
  graph: {
    getSelectedMultiple: jest.fn(() => []),
  },
};

export const mockProcessInitializationData = {
  initializeProcess: jest.fn(),
  loading: false,
  availableFormData: {},
  recordValues: {},
};

export const mockProcessInitialStateData = {
  initialState: {},
  logicFields: {},
  filterExpressions: {},
  refreshParent: false,
  hasData: false,
};

export const mockProcessConfigData = { fetchConfig: jest.fn(), loading: false, error: null, config: {} };

export const mockProcessDefinitionConstants = {
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
};

// Mock Implementations for Jest
export const mockMetadataImplementation = {
  Metadata: {
    getProcess: jest.fn().mockResolvedValue({ id: "TEST_PROCESS_ID" }),
    client: {
      post: jest.fn().mockResolvedValue({ ok: true, data: { parameters: [] } }),
    },
  },
};

// Actions
export const clickExecuteButton = async (container: RenderResult): Promise<void> => {
  const executeButton = container.getByText("common.execute");
  fireEvent.click(executeButton);
};

// Mock Component Implementations
export const MockParamSelector = () => <div data-testid="param-selector">param</div>;
export const MockWindowGrid = () => <div data-testid="window-grid">grid</div>;
export const MockModal = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const MockLoading = () => <div data-testid="loading">loading</div>;

export const MockButton = ({
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
);

export const mockFormData = {
  getValues: () => ({}),
  setValue: jest.fn(),
  watch: () => ({}),
  control: {},
  reset: jest.fn(),
};

export const mockFormState = { isValid: true, isSubmitting: false };
