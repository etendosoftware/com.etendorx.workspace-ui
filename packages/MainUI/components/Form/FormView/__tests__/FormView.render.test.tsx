/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Smoke-render tests for the FormView component.
 *
 * FormView is a large, heavily-connected component (react-hook-form, ~15 hooks/contexts,
 * a zustand store). This suite mocks every external dependency so it can be mounted in
 * isolation, exercising its own render path, memoized derivations, and callbacks —
 * including the stale-object-conflict onError wiring — without depending on their
 * internal implementations (those are covered by their own dedicated test suites).
 */

import type React from "react";
import { act, screen } from "@testing-library/react";
import { renderWithTheme as render } from "../../../../test-utils/test-theme-provider";
import {
  FormMode,
  UIPattern,
  type EntityData,
  type Tab,
  type WindowMetadata,
} from "@workspaceui/api-client/src/api/types";
import FormView from "../index";
import { NEW_RECORD_ID } from "@/utils/url/constants";

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockDatasourceGet = jest.fn().mockResolvedValue({ data: { response: { data: [] } } });
const mockClearCacheForEntity = jest.fn();
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: {
    clearCacheForEntity: (...args: unknown[]) => mockClearCacheForEntity(...args),
    get: (...args: unknown[]) => mockDatasourceGet(...args),
  },
}));

jest.mock("@/services/callouts", () => ({
  globalCalloutManager: {
    suppress: jest.fn(),
    resume: jest.fn(),
    arePendingCalloutsEmpty: jest.fn(() => true),
    isCalloutRunning: jest.fn(() => false),
    waitForIdle: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockShowErrorModal = jest.fn();
const mockShowSuccessModal = jest.fn();
const mockHideStatusModal = jest.fn();
jest.mock("@/hooks/Toolbar/useStatusModal", () => ({
  useStatusModal: () => ({
    statusModal: { open: false, statusType: "info", statusText: "" },
    hideStatusModal: mockHideStatusModal,
    showSuccessModal: mockShowSuccessModal,
    showErrorModal: mockShowErrorModal,
  }),
}));

const mockResetFormChanges = jest.fn();
jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    resetFormChanges: mockResetFormChanges,
    parentTab: null,
    setAuxiliaryInputs: jest.fn(),
    setFormValues: jest.fn(),
  }),
}));

jest.mock("@/contexts/CurrentWindowContext", () => ({
  useCurrentWindowIdentifier: () => "win-1_123456789",
  useCurrentWindowId: () => "window-meta-1",
}));

const mockRegisterFormViewRefetch = jest.fn();
const mockRegisterAttachmentAction = jest.fn();
const mockSetShouldOpenAttachmentModal = jest.fn();
jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({
    registerFormViewRefetch: mockRegisterFormViewRefetch,
    registerAttachmentAction: mockRegisterAttachmentAction,
    shouldOpenAttachmentModal: false,
    setShouldOpenAttachmentModal: mockSetShouldOpenAttachmentModal,
  }),
}));

const mockUpdateRecordInDatasource = jest.fn();
const mockAddRecordToDatasource = jest.fn();
jest.mock("@/contexts/datasourceContext", () => ({
  useDatasourceContext: () => ({
    registerRefetchFunction: jest.fn(),
    updateRecordInDatasource: mockUpdateRecordInDatasource,
    addRecordToDatasource: mockAddRecordToDatasource,
  }),
}));

jest.mock("@/contexts/TabRefreshContext", () => ({
  useTabRefreshContext: () => ({ registerRefresh: jest.fn() }),
}));

const mockGraph = {
  on: jest.fn(),
  off: jest.fn(),
  getSelected: jest.fn(() => null),
  getRecord: jest.fn(() => null),
  setSelected: jest.fn(),
  setSelectedMultiple: jest.fn(),
  getChildren: jest.fn(() => []),
  clearSelected: jest.fn(),
  clearSelectedMultiple: jest.fn(),
};
jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ graph: mockGraph }),
}));

const WINDOW_IDENTIFIER = "win-1_123456789";
const mockSetSelectedRecord = jest.fn();
const mockSetSelectedRecordAndClearChildren = jest.fn();
const mockWindowStoreState = {
  windows: {
    [WINDOW_IDENTIFIER]: {
      windowIdentifier: WINDOW_IDENTIFIER,
      isActive: true,
      tabs: {},
    },
  },
  setSelectedRecord: mockSetSelectedRecord,
  setSelectedRecordAndClearChildren: mockSetSelectedRecordAndClearChildren,
};
function useWindowStoreMock<T>(selector: (state: typeof mockWindowStoreState) => T): T {
  return selector(mockWindowStoreState);
}
useWindowStoreMock.getState = () => mockWindowStoreState;
jest.mock("@/stores/windowStore", () => ({
  useWindowStore: useWindowStoreMock,
}));

jest.mock("@/hooks/useFormFields", () => ({
  __esModule: true,
  default: () => ({
    fields: { statusBarFields: {}, formFields: {}, actionFields: {}, otherFields: {} },
    groups: [],
  }),
}));

jest.mock("@/hooks/useFormInitialState", () => ({
  useFormInitialState: jest.fn(() => ({ documentNo: "SO-001" })),
}));

const mockFormInitRefetch = jest.fn().mockResolvedValue(undefined);
const mockUseFormInitialization = jest.fn(() => ({
  formInitialization: { _readOnly: false, noteCount: 2, attachmentCount: 1, auxiliaryInputValues: {} },
  refetch: mockFormInitRefetch,
  loading: false,
}));
jest.mock("@/hooks/useFormInitialization", () => ({
  useFormInitialization: (...args: unknown[]) => mockUseFormInitialization(...args),
}));

jest.mock("@/hooks/useRecordNavigation", () => ({
  useRecordNavigation: jest.fn(() => ({
    navigationState: { canNavigateNext: false, canNavigatePrevious: false, currentIndex: -1, totalRecords: 0 },
    navigateToNext: jest.fn(),
    navigateToPrevious: jest.fn(),
    isNavigating: false,
  })),
}));

jest.mock("@/hooks/useFormViewNavigation", () => ({
  useFormViewNavigation: jest.fn(() => ({ records: [], hasMoreRecords: false, fetchMore: jest.fn() })),
}));

jest.mock("@/hooks/useRecentDocuments", () => ({
  useRecentDocuments: jest.fn(() => ({ addRecentDocument: jest.fn() })),
}));

jest.mock("@/hooks/useDefaultValueReaction", () => ({
  useDefaultValueReaction: jest.fn(),
}));

jest.mock("../FormHeader", () => ({
  FormHeader: () => <div data-testid="FormHeader-mock" />,
}));

jest.mock("../FormFieldsContent", () => ({
  FormFields: () => <div data-testid="FormFields-mock" />,
}));

let capturedFormActionsProps: Record<string, (...args: never[]) => unknown> | null = null;
jest.mock("../FormActions", () => ({
  FormActions: (props: Record<string, (...args: never[]) => unknown>) => {
    capturedFormActionsProps = props;
    return <div data-testid="FormActions-mock" />;
  },
}));

const mockSave = jest.fn().mockResolvedValue(true);
const mockUseFormAction = jest.fn(() => ({ save: mockSave, loading: false }));
jest.mock("@/hooks/useFormAction", () => {
  const actual = jest.requireActual("@/hooks/useFormAction");
  return {
    ...actual,
    useFormAction: (...args: unknown[]) => mockUseFormAction(...args),
  };
});

const mockTab: Tab = {
  id: "test-tab",
  window: "test-window",
  name: "Test Tab",
  title: "Test Tab",
  fields: {},
  parentColumns: [],
  table: "test_table",
  entityName: "TestEntity",
  tabLevel: 0,
  uIPattern: "STD",
  _identifier: "test-tab-id",
  records: {},
  hqlfilterclause: "",
  hqlwhereclause: "",
  sQLWhereClause: "",
  module: "test-module",
} as unknown as Tab;

const mockWindowMetadata = { id: "window-meta-1", name: "Test Window" } as unknown as WindowMetadata;

function renderFormView(overrides: Partial<React.ComponentProps<typeof FormView>> = {}) {
  const setRecordId = jest.fn();
  const utils = render(
    <FormView
      window={mockWindowMetadata}
      tab={mockTab}
      mode={FormMode.EDIT}
      recordId="123"
      setRecordId={setRecordId}
      {...overrides}
    />
  );
  return { ...utils, setRecordId };
}

describe("FormView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedFormActionsProps = null;
    mockUseFormInitialization.mockReturnValue({
      formInitialization: { _readOnly: false, noteCount: 2, attachmentCount: 1, auxiliaryInputValues: {} },
      refetch: mockFormInitRefetch,
      loading: false,
    });
  });

  it("renders in EDIT mode with an existing record", () => {
    renderFormView();

    expect(screen.getByTestId("FormHeader-mock")).toBeInTheDocument();
    expect(screen.getByTestId("FormFields-mock")).toBeInTheDocument();
    expect(screen.getByTestId("FormActions-mock")).toBeInTheDocument();
  });

  it("renders in NEW mode", () => {
    renderFormView({ mode: FormMode.NEW, recordId: NEW_RECORD_ID });

    expect(screen.getByTestId("FormActions-mock")).toBeInTheDocument();
  });

  it("renders as read-only when uIPattern is READ_ONLY", () => {
    renderFormView({ uIPattern: UIPattern.READ_ONLY });

    expect(screen.getByTestId("FormActions-mock")).toBeInTheDocument();
  });

  it("renders as locked when the document is processing (IP status)", () => {
    mockUseFormInitialization.mockReturnValue({
      formInitialization: { _readOnly: false, documentStatus: "IP", processing: "Y", auxiliaryInputValues: {} },
      refetch: mockFormInitRefetch,
      loading: false,
    });

    renderFormView();

    expect(screen.getByTestId("FormActions-mock")).toBeInTheDocument();
  });

  it("shows the reload-aware conflict notice when onError receives a stale-object reload option", () => {
    renderFormView();

    const lastCallArgs = mockUseFormAction.mock.calls[mockUseFormAction.mock.calls.length - 1][0] as {
      onError: (data: string, options?: { onReload?: () => void }) => void;
    };
    const onReload = jest.fn();

    act(() => {
      lastCallArgs.onError("status.staleObjectError", { onReload });
    });

    expect(mockShowErrorModal).toHaveBeenCalledWith("status.staleObjectError", {
      onReload,
      reloadLabel: "status.staleObjectReloadAction",
    });
  });

  it("shows a plain error notice when onError receives no reload option", () => {
    renderFormView();

    const lastCallArgs = mockUseFormAction.mock.calls[mockUseFormAction.mock.calls.length - 1][0] as {
      onError: (data: string, options?: { onReload?: () => void }) => void;
    };

    act(() => {
      lastCallArgs.onError("Some validation error");
    });

    expect(mockShowErrorModal).toHaveBeenCalledWith("Some validation error", undefined);
  });

  it("wires onStaleObjectReload to a function that refreshes the record", () => {
    renderFormView();

    const lastCallArgs = mockUseFormAction.mock.calls[mockUseFormAction.mock.calls.length - 1][0] as {
      onStaleObjectReload: () => Promise<void> | void;
    };

    expect(typeof lastCallArgs.onStaleObjectReload).toBe("function");
  });

  it("delegates save to useFormAction through FormActions' onSave", async () => {
    renderFormView();

    await act(async () => {
      await capturedFormActionsProps?.onSave?.({} as never);
    });

    expect(mockSave).toHaveBeenCalledWith({});
  });

  it("starts a new record via FormActions' onNew", async () => {
    renderFormView();

    await act(async () => {
      await capturedFormActionsProps?.onNew?.();
    });

    expect(mockResetFormChanges).toHaveBeenCalled();
    expect(mockSetSelectedRecord).toHaveBeenCalledWith(WINDOW_IDENTIFIER, mockTab.id, NEW_RECORD_ID);
  });

  it("discards changes via FormActions' discardChanges", async () => {
    renderFormView();

    await act(async () => {
      await capturedFormActionsProps?.discardChanges?.();
    });

    // discardChanges re-applies the last-loaded record data; it should not blow up
    // and should leave the form mounted.
    expect(screen.getByTestId("FormActions-mock")).toBeInTheDocument();
  });

  it("refreshes the record via FormActions' refetch", async () => {
    renderFormView();

    await act(async () => {
      await capturedFormActionsProps?.refetch?.();
    });

    expect(mockClearCacheForEntity).toHaveBeenCalledWith(mockTab.entityName);
    expect(mockDatasourceGet).toHaveBeenCalled();
  });

  it("onSuccess in EDIT mode refetches, shows the success modal and updates the row in place", async () => {
    renderFormView();

    const lastCallArgs = mockUseFormAction.mock.calls[mockUseFormAction.mock.calls.length - 1][0] as {
      onSuccess: (data: EntityData, options: { showModal?: boolean; skipFormStateUpdate?: boolean }) => Promise<void>;
    };

    await act(async () => {
      await lastCallArgs.onSuccess({ id: "123" } as EntityData, { showModal: true });
    });

    expect(mockClearCacheForEntity).toHaveBeenCalledWith(mockTab.entityName);
    expect(mockGraph.setSelected).toHaveBeenCalled();
    expect(mockFormInitRefetch).toHaveBeenCalled();
    expect(mockShowSuccessModal).toHaveBeenCalledWith("Saved");
    expect(mockResetFormChanges).toHaveBeenCalled();
    expect(mockUpdateRecordInDatasource).toHaveBeenCalled();
  });

  it("onSuccess in NEW mode transitions to EDIT and adds the record to the datasource", async () => {
    const { setRecordId } = renderFormView({ mode: FormMode.NEW, recordId: NEW_RECORD_ID });

    const lastCallArgs = mockUseFormAction.mock.calls[mockUseFormAction.mock.calls.length - 1][0] as {
      onSuccess: (data: EntityData, options: { showModal?: boolean; skipFormStateUpdate?: boolean }) => Promise<void>;
    };

    mockDatasourceGet.mockResolvedValueOnce({ data: { response: { data: [{ id: "456" }] } } });

    await act(async () => {
      await lastCallArgs.onSuccess({ id: "456" } as EntityData, {});
    });

    expect(setRecordId).toHaveBeenCalledWith("456");
    expect(mockAddRecordToDatasource).toHaveBeenCalled();
    expect(mockGraph.setSelectedMultiple).toHaveBeenCalled();
  });
});
