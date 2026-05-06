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

import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { toast } from "sonner";
import { LegacyProcessUnresolvedError } from "@/utils/processes/manual/errors";
import type { ProcessButton } from "@/components/ProcessModal/types";

// Capture the onProcessClick prop from ProcessMenu so tests can invoke it directly
let capturedOnProcessClick: ((button: ProcessButton) => Promise<void> | void) | undefined;

jest.mock("../Menus/ProcessMenu", () => ({
  __esModule: true,
  default: ({ onProcessClick }: { onProcessClick: (button: ProcessButton) => void }) => {
    capturedOnProcessClick = onProcessClick;
    return null;
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/contexts/datasourceContext", () => ({
  useDatasourceContext: () => ({ refetchDatasource: jest.fn() }),
}));
jest.mock("@/contexts/tab", () => ({
  useTabContext: jest.fn().mockReturnValue({
    tab: { id: "tab-1", entityName: "SalesOrder" },
    parentTab: null,
    parentRecord: null,
    hasFormChanges: false,
  }),
}));
jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({
    saveButtonState: {},
    isImplicitFilterApplied: false,
    isAdvancedFilterApplied: false,
    formViewRefetch: null,
  }),
}));
jest.mock("@/hooks/useSelected", () => require("../__testUtils__/toolbarMocks").UseSelectedMock);
jest.mock("@/contexts/window", () => require("../__testUtils__/toolbarMocks").WindowContextMock);
jest.mock("@/hooks/Toolbar/useProcessExecution", () => ({
  useProcessExecution: () => ({ executeProcess: jest.fn(), iframeUrl: "" }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ token: "tok", session: {}, isSessionSyncLoading: false, isCopilotInstalled: false }),
}));
jest.mock("@/hooks/useSelectedRecord", () => ({
  useSelectedRecord: () => ({ id: "rec-1" }),
}));
jest.mock("@/hooks/useSelectedRecords", () => ({
  useSelectedRecords: () => [],
}));
jest.mock("@/hooks/Toolbar/useToolbar", () => ({
  useToolbar: () => ({
    buttons: [],
    // At least one processButton so the conditional {processButtons.length > 0 && <ProcessMenu>} renders
    processButtons: [
      {
        id: "btn-legacy",
        name: "Post",
        action: "processAction",
        enabled: true,
        visible: true,
        processId: "p1",
        buttonText: "Post",
        buttonRefList: [],
        processInfo: {
          loadFunction: "",
          searchKey: "",
          clientSideValidation: "",
          _entityName: "",
          id: "",
          name: "",
          javaClassName: "",
          parameters: [],
        },
        processAction: { id: "pa-1" },
      },
    ],
    loading: false,
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock("@/hooks/Toolbar/useToolbarConfig", () => ({
  useToolbarConfig: () => ({
    handleAction: jest.fn(),
    actionModal: { isOpen: false },
    searchOpen: false,
    setSearchOpen: jest.fn(),
    handleSearch: jest.fn(),
    searchValue: "",
    setSearchValue: jest.fn(),
    confirmAction: null,
    handleConfirm: jest.fn(),
    handleCancelConfirm: jest.fn(),
    closeActionModal: jest.fn(),
  }),
}));

const mockHandleProcessClick = jest.fn();
jest.mock("@/hooks/Toolbar/useProcessButton", () => ({
  useProcessButton: () => ({ handleProcessClick: mockHandleProcessClick }),
}));

jest.mock(
  "@workspaceui/componentlibrary/src/components/IconButton",
  () => require("../__testUtils__/toolbarMocks").IconButtonMock
);
jest.mock(
  "@workspaceui/componentlibrary/src/components/IconButtonWithText",
  () => require("../__testUtils__/toolbarMocks").IconButtonWithTextMock
);
jest.mock("../Modals/EmailSendModal", () => ({ __esModule: true, default: () => null }));
jest.mock("../../ProcessModal/ProcessDefinitionModal", () => ({ __esModule: true, default: () => null }));
jest.mock("../../ProcessModal/Iframe", () => ({ __esModule: true, default: () => null }));
jest.mock("@workspaceui/componentlibrary/src/components/ActionModal", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@workspaceui/componentlibrary/src/components/StatusModal/ConfirmModal", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@mui/icons-material/Email", () => ({ __esModule: true, default: () => null }));
jest.mock("../TopToolbar/TopToolbar", () => ({ __esModule: true, default: () => null }));
jest.mock("../SearchPortal", () => ({ __esModule: true, default: () => null }));
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { clearToolbarCache: jest.fn() },
}));

import { Toolbar } from "../Toolbar";

const processActionButton: ProcessButton = {
  id: "btn-legacy",
  name: "Post",
  action: "processAction",
  enabled: true,
  visible: true,
  processId: "p1",
  buttonText: "Post",
  buttonRefList: [],
  processInfo: {
    loadFunction: "",
    searchKey: "",
    clientSideValidation: "",
    _entityName: "",
    id: "",
    name: "",
    javaClassName: "",
    parameters: [],
  },
  processAction: { id: "pa-1" } as any,
} as any;

describe("Toolbar — runProcessAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnProcessClick = undefined;
  });

  it("shows a toast.error when handleProcessClick throws LegacyProcessUnresolvedError", async () => {
    const legacyError = new LegacyProcessUnresolvedError("btn-legacy", "DocAction");
    mockHandleProcessClick.mockRejectedValue(legacyError);

    render(<Toolbar windowId="win-1" isFormView={false} />);
    expect(capturedOnProcessClick).toBeInstanceOf(Function);

    await act(async () => {
      await capturedOnProcessClick!(processActionButton);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "process.legacyProcessUnresolved.title",
      expect.objectContaining({ description: "process.legacyProcessUnresolved.description" })
    );
  });

  it("does not call toast.error for a successful process action", async () => {
    mockHandleProcessClick.mockResolvedValue({ showInIframe: false });

    render(<Toolbar windowId="win-1" isFormView={false} />);
    expect(capturedOnProcessClick).toBeInstanceOf(Function);

    await act(async () => {
      await capturedOnProcessClick!(processActionButton);
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("re-throws non-LegacyProcessUnresolvedError errors without showing toast", async () => {
    const unexpectedError = new Error("Unexpected failure");
    mockHandleProcessClick.mockRejectedValue(unexpectedError);

    render(<Toolbar windowId="win-1" isFormView={false} />);
    expect(capturedOnProcessClick).toBeInstanceOf(Function);

    let thrownError: Error | undefined;
    try {
      await act(async () => {
        await capturedOnProcessClick!(processActionButton);
      });
    } catch (e) {
      thrownError = e as Error;
    }

    expect(thrownError?.message).toBe("Unexpected failure");
    expect(toast.error).not.toHaveBeenCalled();
  });
});
