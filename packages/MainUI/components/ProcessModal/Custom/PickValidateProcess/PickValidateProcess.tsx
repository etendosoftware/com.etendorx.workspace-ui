/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
 * @fileoverview Custom process modal for Pick & Validate (Warehouse Picking List).
 * Overrides the generic process modal for PICK_VALIDATE_PROCESS_ID.
 */

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import { useUserContext } from "@/hooks/useUserContext";
import { revalidateDopoProcess } from "@/app/actions/revalidate";
import {
  type ResultMessage,
  type ConfirmDialogState,
  INITIAL_CONFIRM_DIALOG,
  parseSmartClientMessage,
} from "../shared/processModalUtils";
import { useBoxManager } from "../shared/useBoxManager";
import {
  LoadingOverlay,
  ErrorAlert,
  ConfirmDialog,
  ResultMessageModal,
  BoxSelector,
  AddBoxButton,
  FormInput,
  ValidateButton,
} from "../shared/ProcessModalShared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PICK_VALIDATE_PROCESS_ID_CONST = "40317268E74C445FA85DB97249AFFE37";
const MANAGE_PICKING_LIST_PROCESS_ID = "B7B1D4F53D4249C5A10D3AD0865D909F";
const VALIDATE_ACTION_HANDLER = "org.openbravo.warehouse.pickinglist.ValidateActionHandler";
const MANAGE_PICKING_LIST_ACTION_HANDLER = "org.openbravo.warehouse.pickinglist.action.ManagePickingListAction";
const VALIDATE_BARCODE_ACTION_HANDLER = "org.openbravo.warehouse.pickinglist.action.ValidateBarcodeAction";
const VALIDATE_BARCODE_PROCESS_ID = "40317268E74C445FA85DB97249AFFE37";
const ENTITY_NAME = "OBWPL_pickinglist";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  scannedInputs: { code: string; qty: number }[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PickValidateProcess: React.FC<PickValidateProcessProps> = ({
  onClose,
  onSuccess,
  pickingListId,
  windowId: _windowId,
}) => {
  const { t } = useTranslation();
  const { token } = useUserContext();

  // UI state
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<PickValidateLine[]>([]);
  const [resultMessage, setResultMessage] = useState<ResultMessage | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(INITIAL_CONFIRM_DIALOG);

  // Form state
  const [currentQty, setCurrentQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Box management (shared hook)
  const { boxCount, currentBox, setCurrentBox, handleAddBox, barcodeInputRef } = useBoxManager();

  // ---------------------------------------------------------------------------
  // Initialize — call ValidateActionHandler with action: 'validate' to load grid data
  // ---------------------------------------------------------------------------

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
  }, [pickingListId, token, barcodeInputRef]);

  // ---------------------------------------------------------------------------
  // Validate barcode — calls ValidateBarcodeAction
  // ---------------------------------------------------------------------------

  const handleValidate = useCallback(async () => {
    if (!barcodeInput) return;

    try {
      setProcessing(true);
      setError(null);

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
  }, [barcodeInput, lines, currentBox, currentQty, boxCount, token, t, barcodeInputRef]);

  // ---------------------------------------------------------------------------
  // Handle qtyVerified inline edit
  // ---------------------------------------------------------------------------

  const handleQtyVerifiedChange = useCallback((lineIdx: number, newVal: number) => {
    setLines((prev) => {
      const next = [...prev];
      const updatedLine = { ...next[lineIdx] };
      const oldVal = updatedLine.qtyVerified || 0;
      const delta = newVal - oldVal;

      updatedLine.qtyVerified = newVal;
      updatedLine.qtyPending = updatedLine.quantity - newVal;

      if (delta > 0) {
        updatedLine.scannedInputs = [...(updatedLine.scannedInputs || []), { code: "", qty: delta }];
      } else if (delta < 0) {
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

  // ---------------------------------------------------------------------------
  // Execute pick validate process — calls ManagePickingListAction
  // ---------------------------------------------------------------------------

  const executeProcess = useCallback(async () => {
    try {
      setProcessing(true);
      setError(null);

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

  // ---------------------------------------------------------------------------
  // Handle process with validation
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------

  const handleBarcodeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleValidate();
      }
    },
    [handleValidate]
  );

  // ---------------------------------------------------------------------------
  // Close result modal and refresh
  // ---------------------------------------------------------------------------

  const handleResultClose = useCallback(async () => {
    setResultMessage(null);
    await revalidateDopoProcess();
    onSuccess?.();
    onClose();
  }, [onClose, onSuccess]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return <LoadingOverlay testId="Loading__pickvalidate" data-testid="LoadingOverlay__7f07bf" />;
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
              <BoxSelector
                label={t("packing.box")}
                currentBox={currentBox}
                boxCount={boxCount}
                onPrev={() => setCurrentBox(Math.max(1, currentBox - 1))}
                onNext={() => setCurrentBox(Math.min(boxCount, currentBox + 1))}
                data-testid="BoxSelector__7f07bf"
              />

              <AddBoxButton
                onClick={() =>
                  handleAddBox(
                    setLines as (updater: (prev: Record<string, unknown>[]) => Record<string, unknown>[]) => void
                  )
                }
                title={t("packing.addBox")}
                data-testid="AddBoxButton__7f07bf"
              />

              <FormInput
                id="pv-qty"
                label={t("pickValidate.quantity")}
                type="number"
                value={currentQty}
                onChange={(e) => setCurrentQty(Math.max(1, Number(e.target.value)))}
                min={1}
                max={9999}
                colSpan={2}
                data-testid="FormInput__7f07bf"
              />

              <FormInput
                id="pv-barcode"
                label={t("pickValidate.barcode")}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder={t("pickValidate.scanBarcode")}
                inputRef={barcodeInputRef}
                colSpan={5}
                data-testid="FormInput__7f07bf"
              />

              <ValidateButton
                onClick={handleValidate}
                disabled={processing || !barcodeInput}
                label={t("pickValidate.validateBarcode")}
                testId="Button__pickvalidate"
                data-testid="ValidateButton__7f07bf"
              />
            </div>

            {/* Error Message */}
            {error && (
              <ErrorAlert
                title={t("pickValidate.validationError")}
                message={error}
                onDismiss={() => setError(null)}
                testId="CloseIcon__pickvalidate_err"
                data-testid="ErrorAlert__7f07bf"
              />
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
      {/* Error/Confirm Dialog */}
      <ConfirmDialog
        state={confirmDialog}
        title={t("pickValidate.validationError")}
        closeLabel={t("pickValidate.close")}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        testIdPrefix="pickvalidate"
        data-testid="ConfirmDialog__7f07bf"
      />
      {/* Result Message Modal */}
      {resultMessage && (
        <ResultMessageModal
          result={resultMessage}
          closeLabel={t("pickValidate.close")}
          onClose={handleResultClose}
          testIdPrefix="pickvalidate"
          data-testid="ResultMessageModal__7f07bf"
        />
      )}
    </>
  );
};
