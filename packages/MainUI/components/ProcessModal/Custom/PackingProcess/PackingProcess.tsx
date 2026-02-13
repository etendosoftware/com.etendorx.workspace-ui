import React, { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
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
  // Extract openDirectTab params
  const match = html.match(/OB\.Utilities\.openDirectTab\(["\s]*([^"',\s)]+)["\s]*,\s*["\s]*([^"',\s)]+)["\s]*\)/i);
  // Strip HTML tags to get clean text, replace the link with a placeholder
  const cleanText = html
    .replace(/<a\s[^>]*>.*?<\/a>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();

  return {
    text: cleanText,
    tabId: match?.[1]?.trim(),
    recordId: match?.[2]?.trim(),
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
            _params: {
              barcode: barcodeInput,
              productIds: lines.map((l) => l.productId),
              validLines: validLines,
              strictMode: true,
            },
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
  }, [lines, boxCount, realShipmentId, checkCalculate, backendWindowId, windowId, token, onClose]);

  // Handle process with pending validation
  const handleProcess = useCallback(() => {
    const pendingLines = lines.filter((l) => l.qtyPending !== 0);
    if (pendingLines.length > 0) {
      setConfirmDialog({
        open: true,
        message: t("packing.pendingToPack"),
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          executeProcess();
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
        <div className="bg-white rounded-lg p-8">
          <Loading data-testid="Loading__3fbaf0" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal backdrop + centering — hidden when showing result */}
      {!resultMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">{t("packing.title")}</h2>
              <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <CloseIcon className="w-5 h-5 text-gray-500" data-testid="CloseIcon__3fbaf0" />
              </button>
            </div>

            {/* Inputs Bar */}
            <div className="px-6 py-3 grid grid-cols-12 gap-3 items-end border-b bg-gray-50 shrink-0">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("packing.box")}</label>
                <input
                  type="number"
                  min={1}
                  max={boxCount}
                  value={currentBox}
                  onChange={(e) => setCurrentBox(Math.max(1, Math.min(boxCount, Number(e.target.value))))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("packing.quantity")}</label>
                <input
                  type="number"
                  min={0}
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("packing.barcode")}</label>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder={t("packing.scanBarcode")}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
                />
              </div>
              <div className="col-span-4 flex gap-2 items-end">
                <button
                  type="button"
                  onClick={handleAddBox}
                  className="bg-white text-blue-600 border border-blue-600 px-3 py-2 rounded shadow-sm hover:bg-blue-50 font-medium text-sm whitespace-nowrap transition-colors">
                  {t("packing.addBox")}
                </button>
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={processing || !barcodeInput}
                  className="bg-blue-600 text-white px-3 py-2 rounded shadow-sm hover:bg-blue-700 font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {t("packing.validateBarcode")}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm shrink-0">
                {error}
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-2 text-red-500 hover:text-red-700 font-bold">
                  ✕
                </button>
              </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-auto px-6 py-3">
              <table className="min-w-full divide-y divide-gray-200 border rounded-md overflow-hidden">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.barcode")}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.product")}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.storageBin")}
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.qty")}
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      {t("packing.qtyPending")}
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r w-16">
                      {t("packing.status")}
                    </th>
                    {Array.from({ length: boxCount }).map((_, i) => (
                      <th
                        key={`th-box-${i + 1}`}
                        className={`px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${i < boxCount - 1 ? "border-r" : ""} w-24`}>
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
                      const rowBg = isOver ? "bg-red-50" : isComplete ? "bg-green-50" : "";
                      const statusColor = isComplete ? "text-green-500" : isOver ? "text-red-500" : "text-gray-300";

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
                            <span className={isOver ? "text-red-600" : isComplete ? "text-green-600" : "text-gray-900"}>
                              {line.qtyPending}
                            </span>
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

            {/* Footer Actions */}
            <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center shrink-0">
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
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded shadow-sm hover:bg-gray-50 font-medium text-sm transition-colors">
                  {t("packing.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={processing}
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {processing && <span className="animate-spin">⟳</span>}
                  {t("packing.generatePack")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⚠</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t("packing.warning")}</h3>
                <p className="mt-1 text-sm text-gray-600">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded shadow-sm hover:bg-gray-50 font-medium text-sm transition-colors">
                {t("packing.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 font-medium text-sm transition-colors">
                {t("packing.continue")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Result Message Modal (shown after process completes) */}
      {resultMessage &&
        (() => {
          const isWarning = resultMessage.type === "warning";
          const isError = resultMessage.type === "error";
          const bgGradient = isWarning
            ? "linear-gradient(180deg, #FFF3CD 0%, #FCFCFD 45%)"
            : isError
              ? "linear-gradient(180deg, #FFD6D6 0%, #FCFCFD 45%)"
              : "linear-gradient(180deg, #BFFFBF 0%, #FCFCFD 45%)";
          const titleColor = isWarning ? "text-amber-600" : isError ? "text-red-600" : "text-green-600";
          const iconBg = isWarning ? "bg-amber-100" : isError ? "bg-red-100" : "bg-green-100";
          const icon = isWarning ? "⚠" : isError ? "✕" : "✓";
          const iconColor = isWarning ? "text-amber-600" : isError ? "text-red-600" : "text-green-600";

          return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
              <div className="rounded-2xl p-6 shadow-xl relative max-w-sm w-full" style={{ background: bgGradient }}>
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
                  <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
                    <span className={`text-xl ${iconColor}`}>{icon}</span>
                  </div>
                  <div className="w-full">
                    <h4 className={`font-medium text-xl text-center ${titleColor}`}>{resultMessage.title}</h4>
                    <p className="text-sm text-center text-gray-700 mt-2">{resultMessage.text}</p>
                    {resultMessage.linkTabId && resultMessage.linkRecordId && (
                      <p className="text-sm text-center mt-1">
                        <button
                          type="button"
                          onClick={() => handleNavigateToTab(resultMessage.linkTabId!, resultMessage.linkRecordId!)}
                          className="text-blue-600 underline hover:text-blue-800">
                          {t("packing.checkStatus")}
                        </button>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResultMessage(null);
                      onClose();
                    }}
                    className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors">
                    {t("packing.close")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};
