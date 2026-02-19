import { render } from "@testing-library/react";
import { FormActions } from "../FormActions";
import { globalCalloutManager } from "../../../../services/callouts";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import WindowProvider from "@/contexts/window";
import { useFormViewContext } from "../contexts/FormViewContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useFormContext } from "react-hook-form";
import { useTabContext } from "@/contexts/tab";

/**
 * Test helpers
 */

// Mock Next.js navigation hooks
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

const createMockRouter = () => ({
  replace: mockReplace,
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
});

const setupSearchParams = (windowId: string) => {
  Array.from(mockSearchParams.keys()).forEach((key) => mockSearchParams.delete(key));
  mockSearchParams.set(`w_${windowId}`, "active");
  mockSearchParams.set(`wi_${windowId}`, windowId);
  mockSearchParams.set(`o_${windowId}`, "1");
};

const createMockTab = (tabId: string, windowId: string, name = "Test Tab"): Tab =>
  ({
    id: tabId,
    name,
    title: name,
    uIPattern: "STD",
    window: { id: windowId, name: "Test Window" },
  }) as unknown as Tab;

const createMockCalloutState = (overrides = {}) => ({
  isRunning: false,
  queueLength: 0,
  pendingCount: 0,
  ...overrides,
});

const createFormActionsProps = (tab: Tab, overrides = {}) => ({
  tab,
  onNew: jest.fn(),
  refetch: jest.fn(),
  onSave: jest.fn(),
  showErrorModal: jest.fn(),
  mode: "EDIT" as const,
  ...overrides,
});

const renderFormActions = (props: ReturnType<typeof createFormActionsProps>) => {
  return render(
    <WindowProvider>
      <FormActions {...props} />
    </WindowProvider>
  );
};

jest.mock("next/navigation", () => ({
  useRouter: () => createMockRouter(),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/window",
}));

// Mock de hooks y contextos usados
jest.mock("react-hook-form", () => ({
  useFormContext: jest.fn(),
  useForm: () => ({
    handleSubmit: jest.fn(),
    reset: jest.fn(),
  }),
  useWatch: jest.fn(() => ({})), // Mock useWatch
}));

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({
    registerActions: jest.fn(),
    setSaveButtonState: jest.fn(),
  }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn(),
}));

jest.mock("@/hooks/useFormValidation", () => ({
  useFormValidation: jest.fn(),
}));

jest.mock("@/contexts/FormInitializationContext", () => ({
  useFormInitializationContext: () => ({
    isFormInitializing: false,
    isSettingInitialValues: false,
  }),
}));

jest.mock("../contexts/FormViewContext", () => ({
  useFormViewContext: jest.fn(),
}));

jest.mock("@/services/callouts", () => ({
  globalCalloutManager: {
    getState: jest.fn(() => ({
      isRunning: false,
      queueLength: 0,
      pendingCount: 0,
    })),
  },
}));

describe("FormActions", () => {
  const mockTab = createMockTab("TAB1", "WIN1");
  const props = createFormActionsProps(mockTab);

  beforeEach(() => {
    mockReplace.mockClear();
    setupSearchParams("WIN1");
    // Default mock implementations
    (useFormContext as jest.Mock).mockReturnValue({
      formState: { isDirty: false },
    });
    (useTabContext as jest.Mock).mockReturnValue({
      markFormAsChanged: jest.fn(),
      resetFormChanges: jest.fn(),
    });
    (useFormValidation as jest.Mock).mockReturnValue({
      validateRequiredFields: jest.fn(() => ({
        isValid: true,
        missingFields: [],
      })),
      requiredFields: [],
    });
    (useFormViewContext as jest.Mock).mockReturnValue({
      mode: "EDIT",
    });
  });

  it("renders and registers actions", () => {
    renderFormActions(props);
    // Esperamos que se registre el objeto con las acciones
    // (el mock de registerActions se llama desde el useEffect)
  });

  it("calls validation when callouts are done", () => {
    (globalCalloutManager.getState as jest.Mock).mockReturnValue(createMockCalloutState());

    renderFormActions(props);
    expect(globalCalloutManager.getState).toHaveBeenCalled();
  });

  it("should enable save when NEW mode and defaults are valid", () => {
    const { useFormViewContext } = require("../contexts/FormViewContext");
    const { useTabContext } = require("@/contexts/tab");

    // Mock NEW mode
    (useFormViewContext as jest.Mock).mockReturnValue({ mode: "NEW" });

    // Mock valid form
    const { useFormValidation } = require("@/hooks/useFormValidation");
    (useFormValidation as jest.Mock).mockReturnValue({
      validateRequiredFields: () => ({ isValid: true, missingFields: [] }),
      requiredFields: [{ hqlName: "active" }],
    });

    const { markFormAsChanged } = useTabContext();

    renderFormActions(props);

    // Debería llamar a markFormAsChanged porque es NEW y válido
    expect(markFormAsChanged).toHaveBeenCalled();
  });

  it("should NOT enable save when EDIT mode even if valid (not dirty)", () => {
    const { useFormViewContext } = require("../contexts/FormViewContext");
    const { useTabContext } = require("@/contexts/tab");

    // Mock EDIT mode
    (useFormViewContext as jest.Mock).mockReturnValue({ mode: "EDIT" });

    // Mock valid form
    const { useFormValidation } = require("@/hooks/useFormValidation");
    (useFormValidation as jest.Mock).mockReturnValue({
      validateRequiredFields: () => ({ isValid: true, missingFields: [] }),
      requiredFields: [{ hqlName: "active" }],
    });

    const { markFormAsChanged, resetFormChanges } = useTabContext();

    renderFormActions(props);

    // No debería marcarse como cambiado en EDIT si no es dirty
    expect(markFormAsChanged).not.toHaveBeenCalled();
    expect(resetFormChanges).toHaveBeenCalled();
  });

  it("should enable save when EDIT mode and isDirty is true", () => {
    const { useFormViewContext } = require("../contexts/FormViewContext");
    const { useFormContext } = require("react-hook-form");
    const { useTabContext } = require("@/contexts/tab");

    // Mock EDIT mode
    (useFormViewContext as jest.Mock).mockReturnValue({ mode: "EDIT" });

    // Mock Dirty
    (useFormContext as jest.Mock).mockReturnValue({ formState: { isDirty: true } });

    const { markFormAsChanged } = useTabContext();

    renderFormActions(props);

    expect(markFormAsChanged).toHaveBeenCalled();
  });
});
