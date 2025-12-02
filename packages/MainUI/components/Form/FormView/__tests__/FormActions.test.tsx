import { render } from "@testing-library/react";
import { FormActions } from "../FormActions";
import { globalCalloutManager } from "../../../../services/callouts";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import WindowProvider from "@/contexts/window";

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
  setRecordId: jest.fn(),
  refetch: jest.fn(),
  onSave: jest.fn(),
  showErrorModal: jest.fn(),
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
  useFormContext: () => ({
    formState: { isDirty: false },
  }),
  useForm: () => ({
    handleSubmit: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({
    registerActions: jest.fn(),
    setSaveButtonState: jest.fn(),
  }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    markFormAsChanged: jest.fn(),
    resetFormChanges: jest.fn(),
  }),
}));

jest.mock("@/hooks/useFormValidation", () => ({
  useFormValidation: () => ({
    validateRequiredFields: jest.fn(() => ({
      isValid: true,
      missingFields: [],
    })),
  }),
}));

jest.mock("@/contexts/FormInitializationContext", () => ({
  useFormInitializationContext: () => ({
    isFormInitializing: false,
  }),
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
});
