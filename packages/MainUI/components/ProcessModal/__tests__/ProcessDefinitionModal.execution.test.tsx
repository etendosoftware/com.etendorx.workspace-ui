import { render, waitFor } from "@testing-library/react";
import ProcessDefinitionModal from "../ProcessDefinitionModal";
import React from "react";
// Keep imports for things used in the test body
import { mockExecuteStringFunctionResponse, mockFetchResponseOk, clickExecuteButton } from "../testUtils";

// Mock executeStringFunction
const mockExecuteStringFunction = jest.fn().mockResolvedValue(mockExecuteStringFunctionResponse);

jest.mock("@/utils/functions", () => ({
  executeStringFunction: (...args: unknown[]) => mockExecuteStringFunction(...args),
}));

// Mock global fetch
global.fetch = jest.fn().mockResolvedValue(mockFetchResponseOk);

jest.mock("@workspaceui/api-client/src/api/metadata", () => require("../testUtils").mockMetadataImplementation);

// Mock server actions
jest.mock("@/app/actions/process", () => ({
  executeProcess: jest.fn(),
}));

jest.mock("@/app/actions/revalidate", () => ({
  revalidateDopoProcess: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock user context
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => require("../testUtils").mockUserContextData,
}));

// Mock other hooks
jest.mock("@/contexts/tab", () => ({
  useTabContext: () => require("../testUtils").mockTabContextData,
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => require("../testUtils").mockSelectedData,
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useProcessInitialization", () => ({
  useProcessInitialization: () => require("../testUtils").mockProcessInitializationData,
}));

jest.mock("@/hooks/useProcessInitialState", () => ({
  useProcessInitializationState: () => require("../testUtils").mockProcessInitialStateData,
}));

jest.mock("@/hooks/datasource/useProcessDatasourceConfig", () => ({
  useProcessConfig: () => require("../testUtils").mockProcessConfigData,
}));

jest.mock("@/utils/processes/definition/constants", () => require("../testUtils").mockProcessDefinitionConstants);

jest.mock("@/components/ProcessModal/callouts/useProcessCallouts", () => ({
  useProcessCallouts: jest.fn(),
}));

// Mock Components
jest.mock("@/components/ProcessModal/selectors/ProcessParameterSelector", () => ({
  __esModule: true,
  default: () => {
    const { MockParamSelector } = require("../testUtils");
    return <MockParamSelector />;
  },
}));

jest.mock("@/components/ProcessModal/WindowReferenceGrid", () => ({
  __esModule: true,
  default: () => {
    const { MockWindowGrid } = require("../testUtils");
    return <MockWindowGrid />;
  },
}));

jest.mock("@/components/Modal", () => ({
  __esModule: true,
  default: ({ children }: any) => {
    const { MockModal } = require("../testUtils");
    return <MockModal>{children}</MockModal>;
  },
}));

jest.mock("@/components/loading", () => ({
  __esModule: true,
  default: () => {
    const { MockLoading } = require("../testUtils");
    return <MockLoading />;
  },
}));

jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({
  __esModule: true,
  default: (props: any) => {
    const { MockButton } = require("../testUtils");
    return <MockButton {...props} />;
  },
}));

jest.mock("react-hook-form", () => ({
  FormProvider: ({ children }: { children: React.ReactNode }) => children,
  useForm: () => require("../testUtils").mockFormData,
  useFormState: () => require("../testUtils").mockFormState,
}));

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
    const container = render(
      <ProcessDefinitionModal
        button={reportButton}
        open={true}
        onClose={mockClose}
        onSuccess={mockSuccess}
        type="report-and-process"
      />
    );

    // Use await with clickExecuteButton
    await clickExecuteButton(container);

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
