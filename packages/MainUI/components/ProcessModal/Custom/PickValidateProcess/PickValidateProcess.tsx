import type React from "react";
import { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check-circle.svg";
import AlertIcon from "@workspaceui/componentlibrary/src/assets/icons/alert-circle.svg";
import Loading from "../../../loading";
import { useUserContext } from "@/hooks/useUserContext";
import { revalidateDopoProcess } from "@/app/actions/revalidate";

// Constants for IDs — Pick & Validate uses different action handlers per operation
const PICK_VALIDATE_PROCESS_ID_CONST = "40317268E74C445FA85DB97249AFFE37";
const MANAGE_PICKING_LIST_PROCESS_ID = "B7B1D4F53D4249C5A10D3AD0865D909F";
const VALIDATE_ACTION_HANDLER = "org.openbravo.warehouse.pickinglist.ValidateActionHandler";
const MANAGE_PICKING_LIST_ACTION_HANDLER = "org.openbravo.warehouse.pickinglist.action.ManagePickingListAction";
const VALIDATE_BARCODE_ACTION_HANDLER = "org.openbravo.warehouse.pickinglist.action.ValidateBarcodeAction";
const VALIDATE_BARCODE_PROCESS_ID = "40317268E74C445FA85DB97249AFFE37";
const ENTITY_NAME = "OBWPL_pickinglist";

/**
 * Extract openDirectTab params from SmartClient HTML messages.
 * Returns the tabId, recordId, and cleaned text (without HTML).
 */
const parseSmartClientMessage = (html: string): { text: string; tabId?: string; recordId?: string } => {
  let tabId: string | undefined;
  let recordId: string | undefined;
  const marker = "openDirectTab(";
  const idx = html.indexOf(marker);
  if (idx !== -1) {
    const argsStart = idx + marker.length;
    const argsEnd = html.indexOf(")", argsStart);
    if (argsEnd !== -1) {
      const argsStr = html.substring(argsStart, argsEnd);
      const args = argsStr.split(",").map((s) => s.replace(/["'\s]/g, ""));
      tabId = args[0] || undefined;
      recordId = args[1] || undefined;
    }
  }

  let cleanText = html;
  const anchorStart = cleanText.indexOf("<a");
  if (anchorStart !== -1) {
    const anchorEnd = cleanText.indexOf("</a>", anchorStart);
    if (anchorEnd !== -1) {
      cleanText = cleanText.substring(0, anchorStart) + cleanText.substring(anchorEnd + 4);
    }
  }
  let result = "";
  let inTag = false;
  for (const ch of cleanText) {
    if (ch === "<") inTag = true;
    else if (ch === ">") inTag = false;
    else if (!inTag) result += ch;
  }

  return { text: result.trim(), tabId, recordId };
};

interface ScannedInput {
  code: string;
  qty: number;
}

interface ResultMessage {
  type: "success" | "warning" | "error";
  title: string;
  text: string;
  linkTabId?: string;
  linkRecordId?: string;
}

interface PickValidateProcessProps {
  onClose: () => void;
  onSuccess?: () => void;
  pickingListId: string;
  windowId: string;
}

interface PickValidateLine {
  productId: string;
  product?: string;
  productName?: string;
  attributeSetValue?: string;
  attributeSetValueId?: string;
  shipmentLineId: string;
  storageBin?: string;
  storageBinId?: string;
  storageBinName?: string;
  barcode?: string;
  auom?: string;
  operationQty?: number;
  quantity: number;
  qtyVerified: number;
  qtyPending: number;
  scannedInputs: ScannedInput[];
  [key: string]: unknown;
}

export const PickValidateProcess: React.FC<PickValidateProcessProps> = ({
  onClose,
  onSuccess,
  pickingListId,
  windowId: _windowId,
}) => {
  const { t } = useTranslation();
  const { token } = useUserContext();

  // State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<PickValidateLine[]>([]);
  const [resultMessage, setResultMessage] = useState<ResultMessage | null>(null);

  // Form State
  const [boxCount, setBoxCount] = useState(1);
  const [currentBox, setCurrentBox] = useState(1);
  const [currentQty, setCurrentQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    message: "",
    onConfirm: () => {},
  });

  // Initialize — call ValidateActionHandler with action: 'validate' to load grid data
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/erp/org.openbravo.client.kernel?processId=${PICK_VALIDATE_PROCESS_ID_CONST}&_action=${VALIDATE_ACTION_HANDLER}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              _buttonValue: "DONE",
              action: "validate",
              recordId: pickingListId,
              _entityName: ENTITY_NAME,
            }),
          }
        );

        const data = await response.json();

        // Backend returns {startRow, endRow, totalRows, data:[...]} directly
        if (Array.isArray(data.data)) {
          const mappedLines: PickValidateLine[] = data.data.map((r: Record<string, unknown>) => ({
            ...r,
            quantity: Number(r.quantity || 0),
            qtyVerified: Number(r.qtyVerified || 0),
            qtyPending: Number(r.qtyPending ?? r.quantity ?? 0),
            productId: String(r.productId || ""),
            shipmentLineId: String(r.shipmentLineId || r.inOutLineId || r.mInOutLineId || r.lineId || r.id || ""),
            scannedInputs: [],
          })) as PickValidateLine[];

          setLines(mappedLines);
        } else if (data.message?.severity === "TYPE_ERROR") {
          setError(String(data.message?.text || "Error loading picking list data"));
        } else {
          setError("No data returned from backend");
        }
      } catch (e) {
        logger.error("Error initializing pick validate process", e);
        setError(e instanceof Error ? e.message : "Initialization failed");
      } finally {
        setLoading(false);
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
    };

    initialize();
  }, [pickingListId, token]);

  // Add a new box column
  const handleAddBox = useCallback(() => {
    const newBoxNo = boxCount + 1;
    setBoxCount(newBoxNo);
    setCurrentBox(newBoxNo);
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
    if (currentBox >= boxCount) setCurrentBox(newCount);
  }, [boxCount, currentBox]);

  // Validate barcode — calls ValidateBarcodeAction (picking list version)
  const handleValidate = useCallback(async () => {
    if (!barcodeInput) return;

    try {
      setProcessing(true);
      setError(null);

      // Build validLines array matching SmartClient format
      const validLines = lines
        .filter((l) => l.shipmentLineId)
        .map((l) => ({
          shipmentLineId: l.shipmentLineId,
          attributeSetValueId: l.attributeSetValueId || null,
          productId: l.productId || null,
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
              validLines: validLines,
            },
            _entityName: ENTITY_NAME,
          }),
        }
      );

      const data = await response.json();
      const returnData = (data.responseActions?.[0]?.returnData || {}) as Record<string, unknown>;

      if (returnData.shipmentLineId) {
        const conversionRate = Number(returnData.conversionRate || 1);
        const scannedBarcode = String(returnData.scannedBarcode || barcodeInput);
        const effectiveQty = currentQty * conversionRate;

        setLines((prev) => {
          const newLines = [...prev];
          const matchedIndex = newLines.findIndex((l) => l.shipmentLineId === returnData.shipmentLineId);

          if (matchedIndex >= 0) {
            const line = { ...newLines[matchedIndex] };
            const boxKey = `box${currentBox}`;
            const currentBoxQty = Number(line[boxKey] || 0);
            line[boxKey] = currentBoxQty + effectiveQty;

            // Recalculate qtyVerified as sum of all boxes
            let totalVerified = 0;
            for (let i = 1; i <= boxCount; i++) {
              totalVerified += Number(line[`box${i}`] || 0);
            }
            line.qtyVerified = totalVerified;
            line.qtyPending = line.quantity - totalVerified;
            line.scannedInputs = [...(line.scannedInputs || []), { code: scannedBarcode, qty: effectiveQty }];
            newLines[matchedIndex] = line;
            return newLines;
          }
          return prev;
        });

        // Clear inputs
        setBarcodeInput("");
        setCurrentQty(1);
      } else {
        setError(t("pickValidate.wrongBarcode"));
      }
    } catch (e) {
      logger.error("Error validating barcode", e);
      setError("Validation failed");
    } finally {
      setProcessing(false);
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [barcodeInput, lines, currentBox, currentQty, boxCount, token, t]);

  // Handle qtyVerified inline edit
  const handleQtyVerifiedChange = useCallback((lineIdx: number, newVal: number) => {
    setLines((prev) => {
      const next = [...prev];
      const updatedLine = { ...next[lineIdx] };
      const oldVal = updatedLine.qtyVerified || 0;
      const delta = newVal - oldVal;

      updatedLine.qtyVerified = newVal;
      updatedLine.qtyPending = updatedLine.quantity - newVal;

      // Track the manual change as a scanned input
      if (delta > 0) {
        updatedLine.scannedInputs = [...(updatedLine.scannedInputs || []), { code: "", qty: delta }];
      } else if (delta < 0) {
        // Pop scanned inputs to undo
        const inputs = [...(updatedLine.scannedInputs || [])];
        let remaining = Math.abs(delta);
        while (remaining > 0 && inputs.length > 0) {
          const last = inputs[inputs.length - 1];
          const lastQty = Math.abs(last.qty) || 1;
          inputs.pop();
          remaining -= lastQty;
        }
        updatedLine.scannedInputs = inputs;
      }

      next[lineIdx] = updatedLine;
      return next;
    });
  }, []);

  // Execute pick validate process — calls ManagePickingListAction matching SmartClient format
  const executeProcess = useCallback(async () => {
    try {
      setProcessing(true);
      setError(null);

      // Build line data matching SmartClient format
      const lineData = lines.map((l) => ({
        productId: l.productId,
        shipmentLineId: l.shipmentLineId,
        qtyVerified: l.qtyVerified,
        scannedInputs: l.scannedInputs || [],
      }));

      const response = await fetch(
        `/api/erp/org.openbravo.client.kernel?processId=${MANAGE_PICKING_LIST_PROCESS_ID}&_action=${MANAGE_PICKING_LIST_ACTION_HANDLER}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            _buttonValue: "DONE",
            _params: {
              pickinglist: [pickingListId],
              action: "process",
              lineData: lineData,
            },
            _entityName: ENTITY_NAME,
          }),
        }
      );

      const data = await response.json();
      const msgAction = data.responseActions?.[0]?.showMsgInProcessView as Record<string, string> | undefined;

      if (msgAction?.msgType === "error") {
        setError(msgAction?.msgText || "Process failed");
      } else {
        const msgText = msgAction?.msgText || "";
        const parsed = parseSmartClientMessage(msgText);

        setResultMessage({
          type: (msgAction?.msgType as ResultMessage["type"]) || "success",
          title: msgAction?.msgTitle || t("pickValidate.title"),
          text: parsed.text || t("pickValidate.processCompleted"),
          linkTabId: parsed.tabId,
          linkRecordId: parsed.recordId,
        });
      }
    } catch (e) {
      logger.error("Error processing pick validate", e);
      setError("Processing failed");
    } finally {
      setProcessing(false);
    }
  }, [lines, pickingListId, token, t]);

  // Handle process with validation — SmartClient blocks if over-limit or no verification done
  const handleProcess = useCallback(() => {
    const overLimit = lines.some((l) => l.qtyVerified > l.quantity);
    const hasNonZero = lines.some((l) => l.qtyVerified > 0);

    if (overLimit || !hasNonZero) {
      setConfirmDialog({
        open: true,
        message: t("pickValidate.pendingToValidate"),
        onConfirm: () => {
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

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <Loading data-testid="Loading__pickvalidate" />
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
            <h3 className="text-lg font-bold">{t("pickValidate.title")}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-(--color-baseline-10) transition-colors"
              disabled={processing}>
              <CloseIcon className="w-5 h-5 text-gray-500" data-testid="CloseIcon__pickvalidate" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4 min-h-[12rem] flex flex-col gap-4">
            {/* Inputs Bar */}
            <div className="grid grid-cols-12 gap-x-5 gap-y-4 items-end">
              {/* Box selector */}
              <div className="col-span-12 sm:col-span-2">
                <span className="flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80) mb-1 select-none">
                  {t("packing.box")}
                </span>
                <div className="flex items-center h-10.5 rounded-t bg-(--color-transparent-neutral-5) border-0 border-b-2 border-(--color-transparent-neutral-30)">
                  <button
                    type="button"
                    onClick={() => setCurrentBox((b) => Math.max(1, b - 1))}
                    disabled={currentBox <= 1}
                    className="flex items-center justify-center w-9 h-full text-(--color-transparent-neutral-60) hover:text-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" aria-label="Previous box">
                      <path
                        d="M8 3L4 7l4 4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <span className="flex-1 flex items-center justify-center font-medium text-sm text-(--color-transparent-neutral-80) select-none tabular-nums">
                    {currentBox}/{boxCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentBox((b) => Math.min(boxCount, b + 1))}
                    disabled={currentBox >= boxCount}
                    className="flex items-center justify-center w-9 h-full text-(--color-transparent-neutral-60) hover:text-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" aria-label="Next box">
                      <path
                        d="M6 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Add box button */}
              <div className="col-span-12 sm:col-span-1 flex items-end h-10.5 pb-[2px]">
                <button
                  type="button"
                  onClick={handleAddBox}
                  className="flex items-center justify-center w-full h-10 rounded bg-(--color-transparent-neutral-5) border-0 border-b-2 border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-60) hover:text-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) transition-colors select-none"
                  title={t("packing.addBox")}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" aria-label="Add box">
                    <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Quantity */}
              <div className="col-span-12 sm:col-span-2">
                <label
                  htmlFor="pv-qty"
                  className="flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80) mb-1 select-none">
                  {t("pickValidate.quantity")}
                </label>
                <input
                  id="pv-qty"
                  type="number"
                  min={1}
                  max={9999}
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) transition-colors"
                />
              </div>

              {/* Barcode */}
              <div className="col-span-12 sm:col-span-5">
                <label
                  htmlFor="pv-barcode"
                  className="flex items-center gap-1 font-medium text-sm leading-5 tracking-normal text-(--color-baseline-80) mb-1 select-none">
                  {t("pickValidate.barcode")}
                </label>
                <input
                  id="pv-barcode"
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder={t("pickValidate.scanBarcode")}
                  className="w-full px-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10) transition-colors"
                />
              </div>

              {/* Validate button */}
              <div className="col-span-12 sm:col-span-2 flex items-end h-10.5 pb-[2px]">
                <Button
                  variant="filled"
                  size="large"
                  onClick={handleValidate}
                  disabled={processing || !barcodeInput}
                  className="whitespace-nowrap w-full px-4 !h-10"
                  data-testid="Button__pickvalidate">
                  {t("pickValidate.validateBarcode")}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded border-l-4 bg-gray-50 border-red-500 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-red-600">{t("pickValidate.validationError")}</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold ml-2">
                  <CloseIcon className="w-4 h-4" data-testid="CloseIcon__pickvalidate_err" />
                </button>
              </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("pickValidate.barcode")}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("pickValidate.product")}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("pickValidate.attributeSet")}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("pickValidate.storageBin")}
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("pickValidate.qty")}
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r w-28">
                      {t("pickValidate.qtyVerified")}
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider border-r">
                      {t("pickValidate.qtyPending")}
                    </th>
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-16">
                      {t("pickValidate.status")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">
                        {t("pickValidate.noLines")}
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, idx) => {
                      const isComplete = line.qtyPending === 0 && line.qtyVerified > 0;
                      const isOver = line.qtyVerified > line.quantity;

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
                            {line.attributeSetValue || "—"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
                            {line.storageBin || line.storageBinName || "—"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right font-medium border-r">
                            {line.quantity}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-center border-r w-28">
                            <input
                              type="number"
                              className="w-full text-center border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-1 bg-white border"
                              value={line.qtyVerified}
                              min={0}
                              onChange={(e) => handleQtyVerifiedChange(idx, Math.max(0, Number(e.target.value)))}
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold border-r">
                            <span className={pendingColor}>{line.qtyPending}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <span className={`text-lg ${statusColor}`}>●</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end mx-4 my-3 pt-3 border-t border-gray-100 shrink-0">
            <div className="flex gap-3">
              <Button
                variant="outlined"
                size="large"
                onClick={onClose}
                className="w-32"
                data-testid="Button__pickvalidate_cancel">
                {t("pickValidate.cancel")}
              </Button>
              <Button
                variant="filled"
                size="large"
                onClick={handleProcess}
                disabled={processing}
                className="w-48 flex items-center justify-center gap-2"
                data-testid="Button__pickvalidate_process">
                {processing && <span className="animate-spin mr-2">⟳</span>}
                {t("pickValidate.process")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Dialog — blocks process execution (same as SmartClient) */}
      {confirmDialog.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 relative">
            <button
              type="button"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors">
              <CloseIcon className="w-5 h-5 text-gray-500" data-testid="CloseIcon__pickvalidate_dialog" />
            </button>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center">
                <AlertIcon className="w-10 h-10 stroke-red-500" data-testid="AlertIcon__pickvalidate" />
              </div>
              <div>
                <h4 className="font-medium text-xl text-center text-red-600">{t("pickValidate.validationError")}</h4>
                <p className="mt-2 text-sm text-center text-gray-600">{confirmDialog.message}</p>
              </div>
              <div className="flex w-full mt-2">
                <Button
                  variant="filled"
                  size="large"
                  onClick={confirmDialog.onConfirm}
                  className="flex-1"
                  data-testid="Button__pickvalidate_close_dialog">
                  {t("pickValidate.close")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Message Modal */}
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

          let icon = (
            <CheckIcon className="w-6 h-6 fill-(--color-success-main)" data-testid="CheckIcon__pickvalidate" />
          );
          if (isWarning)
            icon = <AlertIcon className="w-10 h-10 stroke-amber-600" data-testid="AlertIcon__pickvalidate_warn" />;
          else if (isError)
            icon = <AlertIcon className="w-10 h-10 stroke-red-600" data-testid="AlertIcon__pickvalidate_err" />;

          return (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[60] p-4">
              <div
                className="rounded-2xl p-6 shadow-xl relative max-w-sm w-full"
                style={{ background: isError ? "#fff" : bgGradient }}>
                <button
                  type="button"
                  onClick={async () => {
                    setResultMessage(null);
                    await revalidateDopoProcess();
                    onSuccess?.();
                    onClose();
                  }}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/50 transition-colors">
                  <CloseIcon className="w-5 h-5" data-testid="CloseIcon__pickvalidate_result" />
                </button>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center">{icon}</div>
                  <div className="w-full">
                    <h4 className={`font-medium text-xl text-center ${titleColor}`}>{resultMessage.title}</h4>
                    <p className="text-sm text-center text-(--color-transparent-neutral-80) whitespace-pre-line mt-2">
                      {resultMessage.text}
                    </p>
                  </div>
                  <Button
                    variant="filled"
                    size="large"
                    onClick={async () => {
                      setResultMessage(null);
                      await revalidateDopoProcess();
                      onSuccess?.();
                      onClose();
                    }}
                    className="w-full mt-2"
                    data-testid="Button__pickvalidate_result_close">
                    {t("pickValidate.close")}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
};
