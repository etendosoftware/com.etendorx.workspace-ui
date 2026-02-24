import type React from "react";
import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check-circle.svg";
import AlertIcon from "@workspaceui/componentlibrary/src/assets/icons/alert-circle.svg";
import Loading from "../../../loading";
import { useUserContext } from "@/hooks/useUserContext";
import { useWindowContext } from "@/contexts/window";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { appendWindowToUrl } from "@/utils/url/utils";

// Constants for IDs
const MANAGE_PACKING_PROCESS_ID = "83AD8A78FB1C4EDBB4A222A276498938";
const VALIDATE_BARCODE_PROCESS_ID = "71DEE8098CE74C939575FF57609952CC";
const MANAGE_PACKING_ACTION_HANDLER = "org.openbravo.warehouse.packing.action.ManagePackingAction";
const VALIDATE_BARCODE_ACTION_HANDLER = "org.openbravo.warehouse.packing.action.ValidateBarcodeAction";

/**
 * Extract openDirectTab params from SmartClient HTML messages.
 * Returns the tabId, recordId, and cleaned text (without HTML).
 */
const parseSmartClientMessage = (html: string): { text: string; tabId?: string; recordId?: string } => {
  // Extract openDirectTab params using simple string search (avoids regex backtracking)
  let tabId: string | undefined;
  let recordId: string | undefined;
  const marker = "openDirectTab(";
  const idx = html.indexOf(marker);
  if (idx !== -1) {
    // Extract the arguments substring: everything between openDirectTab( and the next )
    const argsStart = idx + marker.length;
    const argsEnd = html.indexOf(")", argsStart);
    if (argsEnd !== -1) {
      const argsStr = html.substring(argsStart, argsEnd);
      // Split by comma and strip quotes/whitespace from each argument
      const args = argsStr.split(",").map((s) => s.replace(/["'\s]/g, ""));
      tabId = args[0] || undefined;
      recordId = args[1] || undefined;
    }
  }

  // Strip HTML tags using DOMParser-safe approach (no vulnerable regex)
  let cleanText = html;
  // Remove anchor tags and their content first
  const anchorStart = cleanText.indexOf("<a");
  if (anchorStart !== -1) {
    const anchorEnd = cleanText.indexOf("</a>", anchorStart);
    if (anchorEnd !== -1) {
      cleanText = cleanText.substring(0, anchorStart) + cleanText.substring(anchorEnd + 4);
    }
  }
  // Remove remaining HTML tags by iterating (no backtracking-prone regex)
  let result = "";
  let inTag = false;
  for (const ch of cleanText) {
    if (ch === "<") inTag = true;
    else if (ch === ">") inTag = false;
    else if (!inTag) result += ch;
  }

  return {
    text: result.trim(),
    tabId,
    recordId,
  };
};

interface ResultMessage {
  type: "success" | "warning" | "error";
  title: string;
  text: string;
  /** If the backend returned an openDirectTab link, these hold the navigation target */
  linkTabId?: string;
  linkRecordId?: string;
}

interface PackingProcessProps {
  onClose: () => void;
  shipmentId: string;
  windowId: string;
}

interface PackingLine {
  id?: string;
  productId: string;
  product?: string;
  productName?: string;
  attributeSetValue?: string;
  attributeSetValueId?: string;
  shipmentLineId: string;
  storageBin?: string;
  storageBinId?: string;
  storageBinName?: string;
  auom?: string;
  operationQty?: number;
  uomId?: string;
  uomName?: string;
  quantity: number;
  qtyPending: number;
  qtyVerified: number;
  barcode?: string;
  boxed?: number;
  iconStatus?: string;
  [key: string]: unknown;
}

export const PackingProcess: React.FC<PackingProcessProps> = ({ onClose, shipmentId, windowId }) => {
  const { t } = useTranslation();
  const { token } = useUserContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { triggerRecovery, isRecoveryLoading } = useWindowContext();

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<PackingLine[]>([]);
  const [boxCount, setBoxCount] = useState(1);
  const [resultMessage, setResultMessage] = useState<ResultMessage | null>(null);

  // Form State
  const [currentBox, setCurrentBox] = useState(1);
  const [currentQty, setCurrentQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [checkCalculate, setCheckCalculate] = useState(false);
  const [realShipmentId, setRealShipmentId] = useState(shipmentId);
  // windowId from the backend open response (used to determine process vs processHeader)
  const [backendWindowId, setBackendWindowId] = useState<string | null>(null);
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({
    open: false,
    message: "",
    onConfirm: () => {},
  });

  // Initialize - call ManagePackingAction with action: 'open'
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        let targetId = shipmentId;
        setRealShipmentId(shipmentId);

        // Attempt to resolve Shipment ID if we are on Packing Window
        try {
          const resolveRes = await fetch("/api/datasource", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              entity: "MaterialMgmtShipmentInOut",
              params: {
                _operationType: "fetch",
                _startRow: 0,
                _endRow: 1,
                criteria: [
                  JSON.stringify({
                    fieldName: "obwpackPackingh",
                    operator: "equals",
                    value: shipmentId,
                  }),
                ],
              },
            }),
          });
          const resolveData = await resolveRes.json();
          if (resolveData.response?.data?.length > 0) {
            targetId = resolveData.response.data[0].id;
            setRealShipmentId(targetId);
            logger.debug("Resolved Shipment ID from Packing ID");
          }
        } catch (e) {
          logger.warn("ID resolution failed, using original ID", e);
        }

        // Call ManagePackingAction with action: 'open' - matches SmartClient exactly
        const response = await fetch(
          `/api/erp/org.openbravo.client.kernel?processId=${MANAGE_PACKING_PROCESS_ID}&_action=${MANAGE_PACKING_ACTION_HANDLER}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              _buttonValue: "DONE",
              _params: {
                recordId: targetId,
                action: "open",
              },
              _entityName: "obwpack_packingh",
            }),
          }
        );

        const data = await response.json();

        if (data.responseActions && data.responseActions.length > 0) {
          // Check for error message first
          const msgAction = data.responseActions.find(
            (a: Record<string, unknown>) => (a.showMsgInProcessView as Record<string, unknown>)?.msgType === "error"
          );
          if (msgAction) {
            setError(
              String((msgAction.showMsgInProcessView as Record<string, string>)?.msgText || "Error opening packing")
            );
            return;
          }

          // Find action containing grid data (returnData)
          const dataAction = data.responseActions.find(
            (a: Record<string, unknown>) =>
              a.returnData && Array.isArray((a.returnData as Record<string, unknown>).data)
          );

          if (dataAction) {
            const resultData = dataAction.returnData as Record<string, unknown>;
            const gridData = resultData.data as Record<string, unknown>[];

            // Map backend data to our PackingLine format - keep all original fields
            const mappedLines: PackingLine[] = gridData.map((r: Record<string, unknown>) => ({
              ...r,
              // Ensure these fields exist with correct types
              quantity: Number(r.quantity || 0),
              qtyPending: Number(r.qtyPending ?? r.quantity ?? 0),
              qtyVerified: 0,
              boxed: 0,
              box1: 0,
              productId: String(r.productId || ""),
              shipmentLineId: String(r.shipmentLineId || ""),
            })) as PackingLine[];

            setLines(mappedLines);

            // Use boxNo from backend response
            const backendBoxNo = Number(resultData.boxNo) || 1;
            setBoxCount(backendBoxNo);
            setCurrentBox(1);

            // Store backend windowId for process vs processHeader decision
            const respWindowId = String(resultData.windowId || windowId);
            setBackendWindowId(respWindowId);

            // Sync checkCalculate if present
            if (typeof resultData.valuecheck === "boolean") {
              setCheckCalculate(resultData.valuecheck);
            }
          } else {
            setError("No data returned from backend");
          }
        }
      } catch (e) {
        logger.error("Error initializing packing process", e);
        setError(e instanceof Error ? e.message : "Initialization failed");
      } finally {
        setLoading(false);
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
    };

    initialize();
  }, [shipmentId, token, windowId]);

  // Add a new box column
  const handleAddBox = useCallback(() => {
    const newBoxNo = boxCount + 1;
    setBoxCount(newBoxNo);
    setCurrentBox(newBoxNo);
    // Add new box column to lines
    setLines((prev) => prev.map((line) => ({ ...line, [`box${newBoxNo}`]: 0 })));
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, [boxCount]);

  // Remove the last box column
  const handleRemoveBox = useCallback(() => {
    if (boxCount <= 1) return;

    setLines((prev) =>
      prev.map((line) => {
        const newLine = { ...line };
        delete newLine[`box${boxCount}`];
        return newLine;
      })
    );

    const newCount = boxCount - 1;
    setBoxCount(newCount);
    // If we were on the deleted box, move to the new last box
    if (currentBox >= boxCount) {
      setCurrentBox(newCount);
    }
  }, [boxCount, currentBox]);

  // Validate barcode - calls ValidateBarcodeAction
  const handleValidate = useCallback(async () => {
    if (!barcodeInput) return;

    try {
      setProcessing(true);
      setError(null);

      // Build validLines array matching SmartClient format
      const validLines = lines
        .filter((l) => l.shipmentLineId && l.attributeSetValueId)
        .map((l) => ({
          shipmentLineId: l.shipmentLineId,
          attributeSetValueId: l.attributeSetValueId,
        }));

      const response = await fetch(
        `/api/erp/org.openbravo.client.kernel?processId=${VALIDATE_BARCODE_PROCESS_ID}&_action=${VALIDATE_BARCODE_ACTION_HANDLER}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            _buttonValue: "DONE",
            _params: {
              barcode: barcodeInput,
              productIds: lines.map((l) => l.productId),
              validLines: validLines,
              strictMode: true,
            },
            _entityName: "obwpack_packingh",
          }),
        }
      );

      const data = await response.json();
      const returnData = (data.responseActions?.[0]?.returnData || {}) as Record<string, unknown>;

      if (returnData.matchedLineId || returnData.productId) {
        // Success match
        const qtyToAdd = returnData.qty ? Number(returnData.qty) : currentQty;

        setLines((prev) => {
          const newLines = [...prev];
          let matchedIndex = -1;

          // Priority: matchedLineId > productId (same as SmartClient)
          if (returnData.matchedLineId) {
            matchedIndex = newLines.findIndex((l) => l.shipmentLineId === returnData.matchedLineId);
          } else if (returnData.productId) {
            matchedIndex = newLines.findIndex((l) => l.productId === returnData.productId);
          }

          if (matchedIndex >= 0) {
            const line = { ...newLines[matchedIndex] };
            const boxKey = `box${currentBox}`;
            const currentBoxQty = Number(line[boxKey] || 0);
            const newBoxQty = currentBoxQty + qtyToAdd;

            line[boxKey] = newBoxQty;

            // Recalculate: qtyVerified = sum of all boxes, qtyPending = quantity - qtyVerified
            let totalBoxed = 0;
            for (let i = 1; i <= boxCount; i++) {
              totalBoxed += Number(line[`box${i}`] || 0);
            }
            line.qtyVerified = totalBoxed;
            line.boxed = totalBoxed;
            line.qtyPending = line.quantity - totalBoxed;

            newLines[matchedIndex] = line;
            return newLines;
          }
          return prev;
        });

        // Clear inputs
        setBarcodeInput("");
        setCurrentQty(1);
      } else {
        setError(t("packing.wrongBarcode"));
      }
    } catch (e) {
      logger.error("Error validating barcode", e);
      setError("Validation failed");
    } finally {
      setProcessing(false);
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [barcodeInput, lines, currentBox, currentQty, boxCount, token, t]);

  // Execute packing process
  const executeProcess = useCallback(async () => {
    try {
      setProcessing(true);
      setError(null);

      // Determine action type based on backend windowId (same logic as SmartClient)
      const effectiveWindowId = backendWindowId || windowId;
      const actionType = effectiveWindowId === "169" ? "process" : "processHeader";

      // Send _params directly as object — NOT wrapped in info JSON string
      // This matches exactly what SmartClient sends via OB.RemoteCallManager.call
      const response = await fetch(
        `/api/erp/org.openbravo.client.kernel?processId=${MANAGE_PACKING_PROCESS_ID}&_action=${MANAGE_PACKING_ACTION_HANDLER}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            _buttonValue: "DONE",
            _params: {
              data: lines,
              boxNo: boxCount,
              shipmentId: realShipmentId,
              action: actionType,
              value: checkCalculate,
            },
            _entityName: "obwpack_packingh",
          }),
        }
      );

      const data = await response.json();
      const msgAction = data.responseActions?.[0]?.showMsgInProcessView as Record<string, string> | undefined;

      // Match SmartClient behavior: only 'error' is a failure.
      // 'success', 'warning' (e.g. background task), 'info' all close the modal and show result.
      if (msgAction?.msgType === "error") {
        setError(msgAction?.msgText || "Process failed");
      } else {
        const msgText = msgAction?.msgText || "";
        const parsed = parseSmartClientMessage(msgText);

        setResultMessage({
          type: (msgAction?.msgType as ResultMessage["type"]) || "success",
          title: msgAction?.msgTitle || t("packing.title"),
          text: parsed.text || "Process completed",
          linkTabId: parsed.tabId,
          linkRecordId: parsed.recordId,
        });
      }
    } catch (e) {
      logger.error("Error processing packing", e);
      setError("Processing failed");
    } finally {
      setProcessing(false);
    }
  }, [lines, boxCount, realShipmentId, checkCalculate, backendWindowId, windowId, token, t]);

  // Handle process with pending validation
  // SmartClient blocks the process entirely if any line has qtyPending !== 0,
  // showing an error dialog. We replicate that exact behavior here.
  const handleProcess = useCallback(() => {
    const pendingLines = lines.filter((l) => l.qtyPending !== 0);
    if (pendingLines.length > 0) {
      // Block execution — show error dialog (not a confirm), same as SmartClient
      setConfirmDialog({
        open: true,
        message: t("packing.pendingToPack"),
        onConfirm: () => {
          // Just close the dialog — do NOT execute the process
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        },
      });
      return;
    }
    executeProcess();
  }, [lines, t, executeProcess]);

  // Keyboard handling for barcode input
  const handleBarcodeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleValidate();
      }
    },
    [handleValidate]
  );

  // Handle box quantity change inline
  const handleBoxQtyChange = useCallback(
    (lineIdx: number, boxNum: number, newVal: number) => {
      setLines((prev) => {
        const next = [...prev];
        const updatedLine = { ...next[lineIdx] };
        updatedLine[`box${boxNum}`] = newVal;

        // Recalculate pending
        let totalBoxed = 0;
        for (let b = 1; b <= boxCount; b++) {
          totalBoxed += Number(updatedLine[`box${b}`] || 0);
        }
        updatedLine.qtyVerified = totalBoxed;
        updatedLine.boxed = totalBoxed;
        updatedLine.qtyPending = updatedLine.quantity - totalBoxed;

        next[lineIdx] = updatedLine;
        return next;
      });
    },
    [boxCount]
  );

  // Navigate to a tab by resolving tabId → windowId, then opening as internal app tab
  const handleNavigateToTab = useCallback(
    async (tabId: string, recordId: string) => {
      if (isRecoveryLoading) return;

      try {
        // Fetch tab metadata to resolve the windowId
        const res = await fetch(`/api/erp/meta/tab/${tabId}?language=en_US`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const tabData = await res.json();
        const resolvedWindowId = tabData?.window || tabData?.windowId || tabId;

        // Close the packing modal first
        setResultMessage(null);
        onClose();

        // Use the same internal navigation pattern as LinkedItemsSection:
        // 1. Generate unique window identifier
        // 2. Trigger recovery to reset the guard
        // 3. Append window to URL and replace
        const newWindowIdentifier = getNewWindowIdentifier(resolvedWindowId);
        triggerRecovery();

        const newUrlParams = appendWindowToUrl(searchParams, {
          windowIdentifier: newWindowIdentifier,
          tabId: tabId,
          recordId: recordId,
        });

        router.replace(`window?${newUrlParams}`);
      } catch (e) {
        logger.warn("Failed to resolve tab navigation, falling back to direct", e);
        // Fallback: full page navigation
        window.location.href = `/window?wi_0=${tabId}_${Date.now()}&ri_0=${recordId}`;
      }
    },
    [token, isRecoveryLoading, triggerRecovery, searchParams, router, onClose]
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <Loading data-testid="Loading__3fbaf0" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
            <h3 className="text-lg font-bold">{t("packing.title")}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-(--color-baseline-10) transition-colors"
              disabled={processing}>
              <CloseIcon className="w-5 h-5 text-gray-500" data-testid="CloseIcon__3fbaf0" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4 min-h-[12rem] flex flex-col gap-4">
            {/* Inputs Bar - styled as form section */}
            {/* Inputs Bar - styled as form section */}
            <div className="grid grid-cols-12 gap-x-5 gap-y-4 items-end">
              <div className="col-span-12 sm:col-span-2">
                <span className="flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80) mb-1 select-none">
                  {t("packing.box")}
                </span>
                <div className="flex items-center h-10.5 rounded-t bg-(--color-transparent-neutral-5) border-0 border-b-2 border-(--color-transparent-neutral-30)">
                  <button
                    type="button"
                    onClick={() => {
                      if (boxCount <= 1) return;
                      // Remove last box if empty, otherwise just decrease count
                      const isLastBoxEmpty = lines.every((l) => !Number(l[`box${boxCount}`]));
                      if (isLastBoxEmpty) {
                        handleRemoveBox();
                      }
                    }}
                    disabled={boxCount <= 1}
                    className="flex items-center justify-center w-9 h-full text-(--color-transparent-neutral-60) hover:text-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" aria-label="Remove box">
                      <path d="M3 7h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                  <span className="flex-1 flex items-center justify-center font-medium text-sm text-(--color-transparent-neutral-80) select-none tabular-nums">
                    {boxCount}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddBox}
                    className="flex items-center justify-center w-9 h-full text-(--color-transparent-neutral-60) hover:text-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) transition-colors select-none">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" aria-label="Add box">
                      <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="col-span-12 sm:col-span-2">
                <label
                  htmlFor="packing-qty"
                  className="flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80) mb-1 select-none">
                  {t("packing.quantity")}
                </label>
                <input
                  id="packing-qty"
                  type="number"
                  min={0}
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                  className="w-full px-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) transition-colors"
                />
              </div>

              <div className="col-span-12 sm:col-span-6">
                <label
                  htmlFor="packing-barcode"
                  className="flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80) mb-1 select-none">
                  {t("packing.barcode")}
                </label>
                <input
                  id="packing-barcode"
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder={t("packing.scanBarcode")}
                  className="w-full px-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) transition-colors"
                />
              </div>

              <div className="col-span-12 sm:col-span-2 flex items-end h-10.5 pb-[2px]">
                <Button
                  variant="filled"
                  size="large"
                  onClick={handleValidate}
                  disabled={processing || !barcodeInput}
                  className="whitespace-nowrap w-full px-4 !h-10"
                  data-testid="Button__3fbaf0">
                  {t("packing.validateBarcode")}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded border-l-4 bg-gray-50 border-red-500 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-red-600">{t("process.processError")}</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold ml-2">
                  <CloseIcon className="w-4 h-4" data-testid="CloseIcon__3fbaf0" />
                </button>
              </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.barcode")}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.product")}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.storageBin")}
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.qty")}
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.qtyPending")}
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r w-16">
                      {t("packing.status")}
                    </th>
                    {Array.from({ length: boxCount }).map((_, i) => (
                      <th
                        key={`th-box-${i + 1}`}
                        className={`px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider ${i < boxCount - 1 ? "border-r" : ""} w-24`}>
                        {`${t("packing.box")} ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={6 + boxCount} className="px-3 py-8 text-center text-sm text-gray-400">
                        {t("packing.noLines")}
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, idx) => {
                      const isComplete = line.qtyPending === 0;
                      const isOver = line.qtyPending < 0;

                      let rowBg = "";
                      if (isOver) rowBg = "bg-red-50";
                      else if (isComplete) rowBg = "bg-green-50";

                      let statusColor = "text-gray-300";
                      if (isComplete) statusColor = "text-green-500";
                      else if (isOver) statusColor = "text-red-500";

                      let pendingColor = "text-gray-900";
                      if (isOver) pendingColor = "text-red-600";
                      else if (isComplete) pendingColor = "text-green-600";

                      return (
                        <tr key={line.shipmentLineId || idx} className={`hover:bg-gray-50 ${rowBg}`}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
                            {line.barcode || "—"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
                            {line.product || line.productName || line.productId}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
                            {line.storageBin || line.storageBinName || "—"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-medium border-r">
                            {line.quantity}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold border-r">
                            <span className={pendingColor}>{line.qtyPending}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center border-r">
                            <span className={`text-lg ${statusColor}`}>●</span>
                          </td>
                          {Array.from({ length: boxCount }).map((_, i) => {
                            const boxNum = i + 1;
                            const val = Number(line[`box${boxNum}`] || 0);
                            return (
                              <td
                                key={`td-box-${boxNum}-${idx}`}
                                className={`px-2 py-1 whitespace-nowrap text-center ${i < boxCount - 1 ? "border-r" : ""} w-24`}>
                                <input
                                  type="number"
                                  className="w-full text-center border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-1 bg-white border"
                                  value={val}
                                  onChange={(e) => handleBoxQtyChange(idx, boxNum, Number(e.target.value))}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between mx-4 my-3 pt-3 border-t border-gray-100 shrink-0">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="checkCalculate"
                checked={checkCalculate}
                onChange={(e) => setCheckCalculate(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="checkCalculate" className="ml-2 text-sm text-gray-700">
                {t("packing.calculateWeight")}
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="outlined" size="large" onClick={onClose} className="w-32" data-testid="Button__3fbaf0">
                {t("packing.cancel")}
              </Button>
              <Button
                variant="filled"
                size="large"
                onClick={handleProcess}
                disabled={processing}
                className="w-48 flex items-center justify-center gap-2"
                data-testid="Button__3fbaf0">
                {processing && <span className="animate-spin mr-2">⟳</span>}
                {t("packing.generatePack")}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Error Dialog — blocks process execution when lines have pending qty (same as SmartClient) */}
      {confirmDialog.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative">
            <button
              type="button"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <CloseIcon className="w-5 h-5 text-gray-500" data-testid="CloseIcon__3fbaf0" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center">
                <AlertIcon className="w-10 h-10 stroke-red-500" data-testid="AlertIcon__3fbaf0" />
              </div>
              <div>
                <h4 className="font-medium text-xl text-center text-red-600">{t("packing.validationError")}</h4>
                <p className="mt-2 text-sm text-center text-gray-600">{confirmDialog.message}</p>
              </div>
              <div className="flex w-full mt-2">
                <Button
                  variant="filled"
                  size="large"
                  onClick={confirmDialog.onConfirm}
                  className="flex-1"
                  data-testid="Button__3fbaf0">
                  {t("packing.close")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Result Message Modal (using ProcessResultModal styles) */}
      {resultMessage &&
        (() => {
          const isWarning = resultMessage.type === "warning";
          const isError = resultMessage.type === "error";

          let bgGradient = "linear-gradient(180deg, #BFFFBF 0%, #FCFCFD 45%)";
          if (isWarning) bgGradient = "linear-gradient(180deg, #FFF3CD 0%, #FCFCFD 45%)";
          else if (isError) bgGradient = "#fff";

          let titleColor = "text-(--color-success-main)";
          if (isWarning) titleColor = "text-amber-600";
          else if (isError) titleColor = "text-red-600";

          let icon = <CheckIcon className="w-6 h-6 fill-(--color-success-main)" data-testid="CheckIcon__3fbaf0" />;
          if (isWarning) icon = <AlertIcon className="w-10 h-10 stroke-amber-600" data-testid="AlertIcon__3fbaf0" />;
          else if (isError) icon = <AlertIcon className="w-10 h-10 stroke-red-600" data-testid="AlertIcon__3fbaf0" />;

          return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
              <div
                className="rounded-2xl p-6 shadow-xl relative max-w-sm w-full"
                style={{ background: isError ? "#fff" : bgGradient }}>
                <button
                  type="button"
                  onClick={() => {
                    setResultMessage(null);
                    onClose();
                  }}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/50 transition-colors">
                  <CloseIcon className="w-5 h-5" data-testid="CloseIcon__3fbaf0" />
                </button>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center">{icon}</div>
                  <div className="w-full">
                    <h4 className={`font-medium text-xl text-center ${titleColor}`}>{resultMessage.title}</h4>
                    <p className="text-sm text-center text-(--color-transparent-neutral-80) whitespace-pre-line mt-2">
                      {resultMessage.text}
                    </p>
                    {resultMessage.linkTabId && resultMessage.linkRecordId && (
                      <p className="text-sm text-center mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleNavigateToTab(resultMessage.linkTabId as string, resultMessage.linkRecordId as string)
                          }
                          className="text-blue-600 underline hover:text-blue-800 font-medium">
                          {t("packing.checkStatus")}
                        </button>
                      </p>
                    )}
                  </div>
                  <Button
                    variant="filled"
                    size="large"
                    onClick={() => {
                      setResultMessage(null);
                      onClose();
                    }}
                    className="w-full mt-2"
                    data-testid="Button__3fbaf0">
                    {t("packing.close")}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};
