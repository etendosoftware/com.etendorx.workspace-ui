import { render } from "@testing-library/react";
import { FormActions } from "../FormActions";
import { globalCalloutManager } from "../../../../services/callouts";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import WindowProvider from "@/contexts/window";

// Mock Next.js navigation hooks
const mockReplace = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
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
  const mockTab = {
    id: "TAB1",
    name: "Test Tab",
    title: "Test Tab",
    uIPattern: "STD",
    window: { id: "WIN1", name: "Test Window" },
  } as unknown as Tab;

  const props = {
    tab: mockTab,
    setRecordId: jest.fn(),
    refetch: jest.fn(),
    onSave: jest.fn(),
    showErrorModal: jest.fn(),
  };

  beforeEach(() => {
    mockReplace.mockClear();
    // Clear all search params
    Array.from(mockSearchParams.keys()).forEach((key) => mockSearchParams.delete(key));

    // Initialize a window in URL params
    mockSearchParams.set("w_WIN1", "active");
    mockSearchParams.set("wi_WIN1", "WIN1");
    mockSearchParams.set("o_WIN1", "1");
  });

  it("renders and registers actions", () => {
    render(
      <WindowProvider>
        <FormActions {...props} />
      </WindowProvider>
    );
    // Esperamos que se registre el objeto con las acciones
    // (el mock de registerActions se llama desde el useEffect)
  });

  it("calls validation when callouts are done", () => {
    (globalCalloutManager.getState as jest.Mock).mockReturnValue({
      isRunning: false,
      queueLength: 0,
      pendingCount: 0,
    });

    render(
      <WindowProvider>
        <FormActions {...props} />
      </WindowProvider>
    );
    expect(globalCalloutManager.getState).toHaveBeenCalled();
  });
});
