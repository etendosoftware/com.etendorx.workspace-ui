import { render, fireEvent, waitFor } from "@testing-library/react";
import { FormActions } from "../FormActions";
import { globalCalloutManager } from "../../../../services/callouts";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useFormContext } from "react-hook-form";
import { FormMode } from "@workspaceui/api-client/src/api/types";

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

const mockMarkFormAsChanged = jest.fn();
const mockResetFormChanges = jest.fn();
const mockRegisterActions = jest.fn();
const mockSetSaveButtonState = jest.fn();
const mockClearTabFormState = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockUseToolbarContext = jest.fn();

const renderFormActions = (props: ReturnType<typeof createFormActionsProps>) => {
  return render(<FormActions {...props} />);
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
  useToolbarContext: jest.fn(),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    markFormAsChanged: mockMarkFormAsChanged,
    resetFormChanges: mockResetFormChanges,
  }),
}));

jest.mock("@/contexts/window", () => ({
  useWindowContext: () => ({
    activeWindow: { windowIdentifier: "WIN1" },
    clearTabFormState: mockClearTabFormState,
  }),
  WindowProvider: ({ children }: { children: React.ReactNode }) => children,
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

jest.mock("@/services/callouts", () => ({
  globalCalloutManager: {
    getState: jest.fn(() => ({
      isRunning: false,
      queueLength: 0,
      pendingCount: 0,
    })),
    waitForIdle: jest.fn(() => Promise.resolve()),
  },
}));

describe("FormActions", () => {
  const mockTab = createMockTab("TAB1", "WIN1");
  const props = createFormActionsProps(mockTab);

  beforeEach(() => {
    jest.clearAllMocks();
    setupSearchParams("WIN1");
    // Default toolbar context — not busy, no errors
    // biome-ignore lint/suspicious/noExplicitAny: jest require
    (require("@/contexts/ToolbarContext").useToolbarContext as jest.Mock).mockReturnValue({
      registerActions: mockRegisterActions,
      setSaveButtonState: mockSetSaveButtonState,
      saveButtonState: {
        isSaving: false,
        isCalloutLoading: false,
        hasValidationErrors: false,
        validationErrors: [],
      },
    });
    // Default mock implementations
    (useFormContext as jest.Mock).mockReturnValue({
      formState: { isDirty: false },
    });
    (useFormValidation as jest.Mock).mockReturnValue({
      validateRequiredFields: jest.fn(() => ({
        isValid: true,
        missingFields: [],
      })),
      requiredFields: [],
    });
  });

  it("renders and registers actions", () => {
    renderFormActions(props);
    expect(mockRegisterActions).toHaveBeenCalledWith({
      save: expect.any(Function),
      refresh: expect.any(Function),
      back: expect.any(Function),
      new: expect.any(Function),
    });
  });

  it("calls validation when callouts are done", () => {
    (globalCalloutManager.getState as jest.Mock).mockReturnValue(createMockCalloutState());

    renderFormActions(props);
    expect(globalCalloutManager.getState).toHaveBeenCalled();
  });

  it("should enable save when NEW mode and defaults are valid", () => {
    // Mock valid form
    (useFormValidation as jest.Mock).mockReturnValue({
      validateRequiredFields: () => ({ isValid: true, missingFields: [] }),
      requiredFields: [{ hqlName: "active" }],
    });

    renderFormActions({ ...props, mode: FormMode.NEW });

    // Debería llamar a markFormAsChanged porque es NEW y válido
    expect(mockMarkFormAsChanged).toHaveBeenCalled();
  });

  it("should NOT enable save when EDIT mode even if valid (not dirty)", () => {
    // Mock valid form
    (useFormValidation as jest.Mock).mockReturnValue({
      validateRequiredFields: () => ({ isValid: true, missingFields: [] }),
      requiredFields: [{ hqlName: "active" }],
    });

    renderFormActions({ ...props, mode: FormMode.EDIT });

    // No debería marcarse como cambiado en EDIT si no es dirty
    expect(mockMarkFormAsChanged).not.toHaveBeenCalled();
    expect(mockResetFormChanges).toHaveBeenCalled();
  });

  it("should enable save when EDIT mode and isDirty is true", () => {
    // Mock Dirty
    (useFormContext as jest.Mock).mockReturnValue({ formState: { isDirty: true } });

    renderFormActions({ ...props, mode: FormMode.EDIT });

    expect(mockMarkFormAsChanged).toHaveBeenCalled();
  });

  describe("keyboard shortcuts", () => {
    // biome-ignore lint/suspicious/noExplicitAny: jest require
    const toolbarContextMock = () =>
      (require("@/contexts/ToolbarContext").useToolbarContext as jest.Mock);

    it("Ctrl+S calls onSave with showModal: true", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(true);
      renderFormActions({ ...props, onSave: mockOnSave });

      fireEvent.keyDown(document, { key: "s", ctrlKey: true });

      await waitFor(() =>
        expect(mockOnSave).toHaveBeenCalledWith({ showModal: true })
      );
    });

    it("Ctrl+S fires even when an input has focus", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(true);
      const { container } = renderFormActions({ ...props, onSave: mockOnSave });
      const input = document.createElement("input");
      container.appendChild(input);

      fireEvent.keyDown(input, { key: "s", ctrlKey: true });

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
    });

    it("Ctrl+S is a no-op when isSaving is true", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(true);
      toolbarContextMock().mockReturnValue({
        registerActions: mockRegisterActions,
        setSaveButtonState: mockSetSaveButtonState,
        saveButtonState: { isSaving: true, isCalloutLoading: false, hasValidationErrors: false, validationErrors: [] },
      });
      renderFormActions({ ...props, onSave: mockOnSave });

      fireEvent.keyDown(document, { key: "s", ctrlKey: true });

      await new Promise((r) => setTimeout(r, 0));
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("Ctrl+S is a no-op when isCalloutLoading is true", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(true);
      toolbarContextMock().mockReturnValue({
        registerActions: mockRegisterActions,
        setSaveButtonState: mockSetSaveButtonState,
        saveButtonState: { isSaving: false, isCalloutLoading: true, hasValidationErrors: false, validationErrors: [] },
      });
      renderFormActions({ ...props, onSave: mockOnSave });

      fireEvent.keyDown(document, { key: "s", ctrlKey: true });

      await new Promise((r) => setTimeout(r, 0));
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it("Ctrl+N calls onNew", () => {
      const mockOnNew = jest.fn();
      renderFormActions({ ...props, onNew: mockOnNew });

      fireEvent.keyDown(document, { key: "n", ctrlKey: true });

      expect(mockOnNew).toHaveBeenCalledTimes(1);
    });

    it("Escape with clean form calls back (clearTabFormState) without saving", async () => {
      const mockOnSave = jest.fn().mockResolvedValue(true);
      renderFormActions({ ...props, onSave: mockOnSave });

      fireEvent.keyDown(document, { key: "Escape" });

      await new Promise((r) => setTimeout(r, 0));
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockClearTabFormState).toHaveBeenCalledWith("WIN1", "TAB1");
    });

    it("Escape with dirty form saves then calls back", async () => {
      (useFormContext as jest.Mock).mockReturnValue({ formState: { isDirty: true } });
      const mockOnSave = jest.fn().mockResolvedValue(true);
      renderFormActions({ ...props, onSave: mockOnSave });

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() =>
        expect(mockOnSave).toHaveBeenCalledWith({ showModal: false })
      );
      expect(mockClearTabFormState).toHaveBeenCalledWith("WIN1", "TAB1");
    });

    it("Escape with dirty form does NOT call back when save returns false", async () => {
      (useFormContext as jest.Mock).mockReturnValue({ formState: { isDirty: true } });
      const mockOnSave = jest.fn().mockResolvedValue(false);
      renderFormActions({ ...props, onSave: mockOnSave });

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => expect(mockOnSave).toHaveBeenCalled());
      expect(mockClearTabFormState).not.toHaveBeenCalled();
    });

    it("Escape is a no-op when isSaving is true", async () => {
      toolbarContextMock().mockReturnValue({
        registerActions: mockRegisterActions,
        setSaveButtonState: mockSetSaveButtonState,
        saveButtonState: { isSaving: true, isCalloutLoading: false, hasValidationErrors: false, validationErrors: [] },
      });
      const mockOnSave = jest.fn().mockResolvedValue(true);
      renderFormActions({ ...props, onSave: mockOnSave });

      fireEvent.keyDown(document, { key: "Escape" });

      await new Promise((r) => setTimeout(r, 0));
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockClearTabFormState).not.toHaveBeenCalled();
    });

    it("Escape is a no-op when isCalloutLoading is true", async () => {
      toolbarContextMock().mockReturnValue({
        registerActions: mockRegisterActions,
        setSaveButtonState: mockSetSaveButtonState,
        saveButtonState: { isSaving: false, isCalloutLoading: true, hasValidationErrors: false, validationErrors: [] },
      });
      const mockOnSave = jest.fn().mockResolvedValue(true);
      renderFormActions({ ...props, onSave: mockOnSave });

      fireEvent.keyDown(document, { key: "Escape" });

      await new Promise((r) => setTimeout(r, 0));
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockClearTabFormState).not.toHaveBeenCalled();
    });
  });
});
