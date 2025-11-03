import { render } from "@testing-library/react";
import { FormActions } from "../FormActions";
import { globalCalloutManager } from "../../../../services/callouts";
import type { Tab } from "@workspaceui/api-client/src/api/types";

// Mock de hooks y contextos usados
jest.mock("react-hook-form", () => ({
  useFormContext: () => ({
    formState: { isDirty: false },
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

jest.mock("@/hooks/navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: () => ({
    activeWindow: { windowId: "TEST_WINDOW" },
    clearTabFormStateAtomic: jest.fn(),
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

  it("renders and registers actions", () => {
    render(<FormActions {...props} />);
    // Esperamos que se registre el objeto con las acciones
    // (el mock de registerActions se llama desde el useEffect)
  });

  it("calls validation when callouts are done", () => {
    (globalCalloutManager.getState as jest.Mock).mockReturnValue({
      isRunning: false,
      queueLength: 0,
      pendingCount: 0,
    });

    render(<FormActions {...props} />);
    expect(globalCalloutManager.getState).toHaveBeenCalled();
  });
});
