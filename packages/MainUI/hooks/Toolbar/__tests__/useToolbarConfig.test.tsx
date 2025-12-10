import { renderHook, act } from "@testing-library/react";
import { useToolbarConfig } from "../useToolbarConfig";
import { useTabContext } from "@/contexts/tab";
import { useWindowContext } from "@/contexts/window";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { useSelectedRecord } from "@/hooks/useSelectedRecord";
import { useRecordContext } from "@/hooks/useRecordContext";
import { useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { copyRecordRequest, handleCopyRecordResponse } from "@/utils/processes/toolbar/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useStatusModal } from "../useStatusModal";
import { useSelected } from "@/hooks/useSelected";
import { useSearch } from "@/contexts/searchContext";
import { useMetadataContext } from "@/hooks/useMetadataContext";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useDeleteRecord } from "@/hooks/useDeleteRecord";

// Mock dependencies
jest.mock("@/contexts/tab");
jest.mock("@/contexts/window");
jest.mock("@/hooks/useSelectedRecords");
jest.mock("@/hooks/useSelectedRecord");
jest.mock("@/hooks/useRecordContext");
jest.mock("@/contexts/TabRefreshContext");
jest.mock("@/utils/processes/toolbar/utils");
jest.mock("@/hooks/useTranslation");
jest.mock("../useStatusModal");
jest.mock("@/hooks/useSelected");
jest.mock("@/contexts/searchContext");
jest.mock("@/hooks/useMetadataContext");
jest.mock("@/contexts/ToolbarContext");
jest.mock("@/hooks/useDeleteRecord", () => ({
  useDeleteRecord: jest.fn(),
}));
jest.mock("@/utils/logger");

describe("useToolbarConfig", () => {
  const mockTab = {
    id: "tab1",
    entityName: "TestEntity",
    obuiappCloneChildren: false,
    tabLevel: 0,
  };

  const mockActiveWindow = {
    windowId: "window1",
    windowIdentifier: "windowIdentifier1",
  };

  const mockT = jest.fn((key) => key);
  const mockShowErrorModal = jest.fn();
  const mockTriggerParentRefreshes = jest.fn();
  const mockSetSelectedRecord = jest.fn();
  const mockSetTabFormState = jest.fn();
  const mockClearSelectedRecord = jest.fn();
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useTabContext as jest.Mock).mockReturnValue({ tab: mockTab });
    (useWindowContext as jest.Mock).mockReturnValue({
      activeWindow: mockActiveWindow,
      clearSelectedRecord: mockClearSelectedRecord,
      getSelectedRecord: jest.fn(),
      setSelectedRecord: mockSetSelectedRecord,
      setTabFormState: mockSetTabFormState,
    });
    (useSelectedRecords as jest.Mock).mockReturnValue([]);
    (useSelectedRecord as jest.Mock).mockReturnValue(null);
    (useRecordContext as jest.Mock).mockReturnValue({
      contextString: "",
      hasSelectedRecords: false,
      contextItems: [],
    });
    (useTabRefreshContext as jest.Mock).mockReturnValue({
      triggerParentRefreshes: mockTriggerParentRefreshes,
    });
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    (useStatusModal as jest.Mock).mockReturnValue({
      statusModal: { open: false },
      showErrorModal: mockShowErrorModal,
      showConfirmModal: jest.fn(),
      showDeleteSuccessModal: jest.fn(),
    });
    (useSelected as jest.Mock).mockReturnValue({
      graph: { clearSelected: jest.fn(), clearSelectedMultiple: jest.fn() },
    });
    (useSearch as jest.Mock).mockReturnValue({ setSearchQuery: jest.fn() });
    (useMetadataContext as jest.Mock).mockReturnValue({ removeRecord: jest.fn() });
    (useToolbarContext as jest.Mock).mockReturnValue({ onRefresh: mockOnRefresh });
    (useDeleteRecord as jest.Mock).mockReturnValue({ deleteRecord: jest.fn(), loading: false });
  });

  it("initializes correctly", () => {
    const { result } = renderHook(() => useToolbarConfig({ tabId: "tab1", isFormView: false }));
    expect(result.current.actionModal.isOpen).toBe(false);
  });

  describe("handleCopyRecord", () => {
    it("does nothing if no records are selected", () => {
      const { result } = renderHook(() => useToolbarConfig({ tabId: "tab1", isFormView: false }));

      act(() => {
        result.current.actionHandlers.COPY_RECORD();
      });

      expect(result.current.actionModal.isOpen).toBe(false);
    });

    it("opens simple confirmation modal when obuiappCloneChildren is false", () => {
      (useSelectedRecords as jest.Mock).mockReturnValue([{ id: "record1" }]);
      const { result } = renderHook(() => useToolbarConfig({ tabId: "tab1", isFormView: false }));

      act(() => {
        result.current.actionHandlers.COPY_RECORD();
      });

      expect(result.current.actionModal.isOpen).toBe(true);
      expect(result.current.actionModal.buttons).toHaveLength(2);
      expect(result.current.actionModal.buttons[0].label).toBe("common.trueText");
    });

    it("opens complex confirmation modal when obuiappCloneChildren is true", () => {
      (useTabContext as jest.Mock).mockReturnValue({ tab: { ...mockTab, obuiappCloneChildren: true } });
      (useSelectedRecords as jest.Mock).mockReturnValue([{ id: "record1" }]);
      const { result } = renderHook(() => useToolbarConfig({ tabId: "tab1", isFormView: false }));

      act(() => {
        result.current.actionHandlers.COPY_RECORD();
      });

      expect(result.current.actionModal.isOpen).toBe(true);
      expect(result.current.actionModal.buttons).toHaveLength(3);
      expect(result.current.actionModal.buttons[0].label).toBe("common.clone");
      expect(result.current.actionModal.buttons[1].label).toBe("common.cloneWithChildren");
    });

    it("calls copyRecordRequest and handleCopyRecordResponse on confirmation", async () => {
      (useSelectedRecords as jest.Mock).mockReturnValue([{ id: "record1" }]);
      (copyRecordRequest as jest.Mock).mockResolvedValue({ ok: true, data: {} });

      const { result } = renderHook(() => useToolbarConfig({ tabId: "tab1", isFormView: false }));

      act(() => {
        result.current.actionHandlers.COPY_RECORD();
      });

      // Click the confirm button (first button)
      await act(async () => {
        await result.current.actionModal.buttons[0].onClick();
      });

      expect(copyRecordRequest).toHaveBeenCalledWith(
        mockTab,
        ["record1"],
        mockActiveWindow.windowId,
        true // Assuming simple clone defaults to true for copyChildren in the implementation logic for "Yes"
      );
      expect(handleCopyRecordResponse).toHaveBeenCalled();
    });
  });
});
