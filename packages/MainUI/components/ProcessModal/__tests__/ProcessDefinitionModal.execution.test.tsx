import { render, waitFor } from "@testing-library/react";
import ProcessDefinitionModal from "../ProcessDefinitionModal";
import type React from "react";
// Keep imports for things used in the test body
import { mockExecuteStringFunctionResponse, mockFetchResponseOk, clickExecuteButton, mockFormData } from "../testUtils";
import { messageBar } from "@/utils/processes/definition/messageBarStore";

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

jest.mock("@/stores/windowStore", () => ({
  useWindowStore: (selector: (s: any) => any) =>
    selector({
      triggerRecovery: jest.fn(),
      isRecoveryLoading: false,
    }),
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => require("../testUtils").mockSelectedData,
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Configurable seed-loading flag so a test can simulate the async process-defaults
// seed being in-flight (true) vs complete (false). Defaults to false, preserving
// the behaviour every other test in this file relies on.
let mockInitializationLoading = false;
jest.mock("@/hooks/useProcessInitialization", () => ({
  useProcessInitialization: () => ({
    ...require("../testUtils").mockProcessInitializationData,
    loading: mockInitializationLoading,
  }),
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

  test("Direct Java Process Execution (no etmetaOnprocess, javaClassName present)", async () => {
    const directJavaButton = {
      name: "Java Process",
      processDefinition: {
        id: "TEST_PROCESS_ID",
        name: "Test Java Process",
        javaClassName: "com.test.TestProcess",
        parameters: {},
        etmetaOnprocess: null, // No JS handler
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

  // Classic's openProcess returns before buildProcess when uiPattern is 'M', so a
  // Manual process never gets a parameter window. Its OBUIAPP_Parameter rows are
  // dead metadata (e.g. the SII senders' "Warning" row, whose default value is the
  // confirmation text the migrated script raises through confirm()).
  describe("Manual process parameters", () => {
    const warningParameter = {
      name: "Warning",
      dBColumnName: "warning",
      reference: "14",
      defaultValue: "This action is not reversible",
    };

    const manualButton = (uIPattern?: string) => ({
      name: "Send to SII",
      processDefinition: {
        id: "TEST_MANUAL_ID",
        name: "SII Invoice Sender",
        javaClassName: "OB.AEATSII.send",
        uIPattern,
        parameters: { warning: warningParameter },
      },
    });

    test("does not render the dictionary parameters of a Manual process", () => {
      const { queryAllByTestId } = renderModal(manualButton("M"));
      expect(queryAllByTestId("param-selector")).toHaveLength(0);
    });

    test("still renders the same parameters for a non-Manual process", () => {
      const { queryAllByTestId } = renderModal(manualButton());
      expect(queryAllByTestId("param-selector")).toHaveLength(1);
    });
  });

  describe("onLoad seed timing", () => {
    const ON_LOAD_CODE = "view.theForm.getItem('payment_method').hide();";
    const onLoadButton = {
      name: "OnLoad Process",
      processDefinition: {
        id: "TEST_ONLOAD_ID",
        name: "Test OnLoad",
        parameters: {},
        etmetaOnload: ON_LOAD_CODE,
      },
    };

    afterEach(() => {
      // Restore the default so the rest of the file is unaffected.
      mockInitializationLoading = false;
    });

    test("does NOT run onLoad while the process-defaults seed is in-flight", async () => {
      mockInitializationLoading = true;
      renderModal(onLoadButton);

      // Flush pending microtasks; onLoad must stay deferred (Classic seeds first).
      await Promise.resolve();
      await Promise.resolve();
      expect(mockExecuteStringFunction).not.toHaveBeenCalled();
    });

    test("runs onLoad once the seed completes and clears seed-time validation errors", async () => {
      // onLoad returns nothing so the loop does not early-return before clearErrors.
      mockExecuteStringFunction.mockResolvedValueOnce(undefined);
      mockInitializationLoading = false;
      renderModal(onLoadButton);

      await waitFor(() => {
        expect(mockExecuteStringFunction).toHaveBeenCalledWith(
          ON_LOAD_CODE,
          expect.anything(),
          expect.anything(),
          expect.anything()
        );
      });
      await waitFor(() => {
        expect(mockFormData.clearErrors).toHaveBeenCalled();
      });
    });
  });

  // An openUrl hand-off produces no result, so in direct-execute mode the bare
  // overlay would stay up forever. When the popup is blocked, the "Open link"
  // banner is the only remaining way to reach the URL and must be visible.
  describe("direct-execute overlay and the message bar", () => {
    const openUrlButton = {
      name: "Open Swagger",
      processDefinition: {
        id: "TEST_OPENURL_ID",
        name: "Open Swagger",
        parameters: {},
        etmetaOnload: "() => ({ type: 'directExecute' })",
        etmetaOnprocess: "async () => ({ type: 'openUrl', url: 'https://example.test' })",
      },
    };

    const originalOpen = window.open;

    afterEach(() => {
      window.open = originalOpen;
      messageBar.hide();
    });

    test("closes on the script's request even though the execution transition is still pending", async () => {
      const openedWindow = {} as Window;
      window.open = jest.fn(() => openedWindow) as unknown as typeof window.open;
      mockExecuteStringFunction
        .mockResolvedValueOnce({ type: "directExecute" })
        .mockResolvedValueOnce({ type: "openUrl", url: "https://example.test", closeModal: true });

      renderModal(openUrlButton);

      // `closeModal` dispatches from inside the transition, so a close routed
      // through the user-facing pending guard would never fire and the overlay
      // would hang forever with no chrome to dismiss it.
      await waitFor(() => expect(mockClose).toHaveBeenCalled());
    });

    test("gives the chrome back so the popup-blocked banner is reachable", async () => {
      window.open = jest.fn(() => null) as unknown as typeof window.open;
      mockExecuteStringFunction
        .mockResolvedValueOnce({ type: "directExecute" })
        .mockResolvedValueOnce({ type: "openUrl", url: "https://example.test" });

      const { findByTestId, findByText } = renderModal(openUrlButton);

      // The message bar only exists in the chrome, never in the bare overlay.
      expect(await findByTestId("ProcessMessageBar__container")).toBeInTheDocument();
      expect(await findByText("process.popupBlocked")).toBeInTheDocument();
      expect(await findByText("process.openLink")).toBeInTheDocument();
    });

    // The failure this whole change is about: the handler answered with a business
    // error, the script never inspected it, so the URL came back undefined. The
    // hand-off cannot be served — and reporting success would be a lie.
    test("reports an error instead of success when the hand-off carries no url", async () => {
      window.open = jest.fn(() => null) as unknown as typeof window.open;
      mockExecuteStringFunction
        .mockResolvedValueOnce({ type: "directExecute" })
        .mockResolvedValueOnce({ type: "openUrl", url: undefined, closeModal: true });

      const { findByText } = renderModal(openUrlButton);

      expect(await findByText("process.openUrlMissingUrl")).toBeInTheDocument();
      // The success path closes the modal; this one must leave it open and readable.
      expect(mockClose).not.toHaveBeenCalled();
    });
  });

  // Classic headed the message bar with the handler's own title
  // (`setMessage(TYPE_ERROR, data.message.title, data.message.text)`), so the
  // in-modal banner must use it whenever the response carries one.
  describe("error banner heading", () => {
    const errorButton = {
      name: "Recalculate Permissions",
      processDefinition: {
        id: "TEST_BANNER_ID",
        name: "Recalculate Role Permissions",
        parameters: {},
        etmetaOnprocess: "async () => ({})",
      },
    };

    test("uses the server title when the response carries one", async () => {
      mockExecuteStringFunction.mockResolvedValueOnce({
        message: { msgType: "error", msgTitle: "Recalculation failed", msgText: "Inconsistent inheritance" },
      });

      const container = renderModal(errorButton);
      await clickExecuteButton(container);

      expect(await container.findByText("Recalculation failed")).toBeInTheDocument();
      expect(await container.findByText("Inconsistent inheritance")).toBeInTheDocument();
    });

    // A migrated script that hands the handler's own `message` back untouched —
    // the raw Etendo spelling, not the script-facing msgType/msgTitle/msgText.
    // This is how PSD2 Get Consents surfaces "No API Key available for the user."
    test("renders the handler's raw message shape as an error, title included", async () => {
      mockExecuteStringFunction.mockResolvedValueOnce({
        message: { severity: "error", title: "ERROR", text: "No API Key available for the user." },
      });

      const container = renderModal(errorButton);
      await clickExecuteButton(container);

      expect(await container.findByText("ERROR")).toBeInTheDocument();
      expect(await container.findByText("No API Key available for the user.")).toBeInTheDocument();
      // An error keeps the dialog open so the message stays readable.
      expect(mockClose).not.toHaveBeenCalled();
    });

    test("falls back to the generic heading when the response carries no title", async () => {
      mockExecuteStringFunction.mockResolvedValueOnce({
        message: { msgType: "error", msgText: "Inconsistent inheritance" },
      });

      const container = renderModal(errorButton);
      await clickExecuteButton(container);

      expect(await container.findByText("process.processError")).toBeInTheDocument();
    });
  });
});
