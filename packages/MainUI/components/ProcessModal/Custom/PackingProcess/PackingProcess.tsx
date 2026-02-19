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

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import { useUserContext } from "@/hooks/useUserContext";
import { useWindowContext } from "@/contexts/window";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { appendWindowToUrl } from "@/utils/url/utils";
import {
  parseSmartClientMessage,
  INITIAL_CONFIRM_DIALOG,
  type ResultMessage,
  type ConfirmDialogState,
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

const MANAGE_PACKING_PROCESS_ID = "83AD8A78FB1C4EDBB4A222A276498938";
const VALIDATE_BARCODE_PROCESS_ID = "71DEE8098CE74C939575FF57609952CC";
const MANAGE_PACKING_ACTION_HANDLER = "org.openbravo.warehouse.packing.action.ManagePackingAction";
const VALIDATE_BARCODE_ACTION_HANDLER = "org.openbravo.warehouse.packing.action.ValidateBarcodeAction";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  const [resultMessage, setResultMessage] = useState<ResultMessage | null>(null);
  const [checkCalculate, setCheckCalculate] = useState(false);
  const [realShipmentId, setRealShipmentId] = useState(shipmentId);
  const [backendWindowId, setBackendWindowId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(INITIAL_CONFIRM_DIALOG);

  // Form state
  const [currentQty, setCurrentQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Box management (shared hook)
  const { boxCount, currentBox, setBoxCount, setCurrentBox, barcodeInputRef } = useBoxManager();

  // handleAddBox / handleRemoveBox defined inline to use PackingLine-typed setLines
  const handleAddBox = useCallback(() => {
    const newBoxNo = boxCount + 1;
    setBoxCount(newBoxNo);
    setCurrentBox(newBoxNo);
    setLines((prev) => prev.map((line) => ({ ...line, [`box${newBoxNo}`]: 0 })));
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, [boxCount, setBoxCount, setCurrentBox, barcodeInputRef]);

  const _handleRemoveBox = useCallback(() => {
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
  }, [boxCount, currentBox, setBoxCount, setCurrentBox]);

  // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------

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
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              entity: "MaterialMgmtShipmentInOut",
              params: {
                _operationType: "fetch",
                _startRow: 0,
                _endRow: 1,
                criteria: [JSON.stringify({ fieldName: "obwpackPackingh", operator: "equals", value: shipmentId })],
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

        const response = await fetch(
          `/api/erp/org.openbravo.client.kernel?processId=${MANAGE_PACKING_PROCESS_ID}&_action=${MANAGE_PACKING_ACTION_HANDLER}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              _buttonValue: "DONE",
              _params: { recordId: targetId, action: "open" },
              _entityName: "obwpack_packingh",
            }),
          }
        );

        const data = await response.json();

        if (data.responseActions && data.responseActions.length > 0) {
          const msgAction = data.responseActions.find(
            (a: Record<string, unknown>) => (a.showMsgInProcessView as Record<string, unknown>)?.msgType === "error"
          );
          if (msgAction) {
            setError(
              String((msgAction.showMsgInProcessView as Record<string, string>)?.msgText || "Error opening packing")
            );
            return;
          }

          const dataAction = data.responseActions.find(
            (a: Record<string, unknown>) =>
              a.returnData && Array.isArray((a.returnData as Record<string, unknown>).data)
          );

          if (dataAction) {
            const resultData = dataAction.returnData as Record<string, unknown>;
            const gridData = resultData.data as Record<string, unknown>[];
            const backendBoxNo = Number(resultData.boxNo) || 1;

            const mappedLines: PackingLine[] = gridData.map((r: Record<string, unknown>) => {
              const boxColumns: Record<string, number> = {};
              for (let i = 1; i <= backendBoxNo; i++) {
                boxColumns[`box${i}`] = Number(r[`box${i}`] || 0);
              }
              const qtyVerified = Object.values(boxColumns).reduce((sum, v) => sum + v, 0);
              return {
                ...r,
                ...boxColumns,
                quantity: Number(r.quantity || 0),
                qtyPending: Number(r.qtyPending ?? r.quantity ?? 0),
                qtyVerified,
                boxed: Number(r.boxed || qtyVerified),
                productId: String(r.productId || ""),
                shipmentLineId: String(r.shipmentLineId || ""),
              };
            }) as PackingLine[];

            setLines(mappedLines);
            setBoxCount(backendBoxNo);
            setCurrentBox(1);

            const respWindowId = String(resultData.windowId || windowId);
            setBackendWindowId(respWindowId);
            if (typeof resultData.valuecheck === "boolean") setCheckCalculate(resultData.valuecheck);
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
  }, [shipmentId, token, windowId, setBoxCount, setCurrentBox, barcodeInputRef]);

  // ---------------------------------------------------------------------------
  // Validate barcode
  // ---------------------------------------------------------------------------

  const handleValidate = useCallback(async () => {
    if (!barcodeInput) return;

    try {
      setProcessing(true);
      setError(null);

      const validLines = lines
        .filter((l) => l.shipmentLineId && l.attributeSetValueId)
        .map((l) => ({ shipmentLineId: l.shipmentLineId, attributeSetValueId: l.attributeSetValueId }));

      const response = await fetch(
        `/api/erp/org.openbravo.client.kernel?processId=${VALIDATE_BARCODE_PROCESS_ID}&_action=${VALIDATE_BARCODE_ACTION_HANDLER}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            _buttonValue: "DONE",
            _params: { barcode: barcodeInput, productIds: lines.map((l) => l.productId), validLines, strictMode: true },
            _entityName: "obwpack_packingh",
          }),
        }
      );

      const data = await response.json();
      const returnData = (data.responseActions?.[0]?.returnData || {}) as Record<string, unknown>;

      if (returnData.matchedLineId || returnData.productId) {
        const qtyToAdd = returnData.qty ? Number(returnData.qty) : currentQty;

        setLines((prev) => {
          const newLines = [...prev];
          let matchedIndex = -1;
          if (returnData.matchedLineId) {
            matchedIndex = newLines.findIndex((l) => l.shipmentLineId === returnData.matchedLineId);
          } else if (returnData.productId) {
            matchedIndex = newLines.findIndex((l) => l.productId === returnData.productId);
          }

          if (matchedIndex >= 0) {
            const line = { ...newLines[matchedIndex] };
            const boxKey = `box${currentBox}`;
            line[boxKey] = Number(line[boxKey] || 0) + qtyToAdd;

            let totalBoxed = 0;
            for (let i = 1; i <= boxCount; i++) totalBoxed += Number(line[`box${i}`] || 0);
            line.qtyVerified = totalBoxed;
            line.boxed = totalBoxed;
            line.qtyPending = line.quantity - totalBoxed;

            newLines[matchedIndex] = line;
            return newLines;
          }
          return prev;
        });

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
  }, [barcodeInput, lines, currentBox, currentQty, boxCount, token, t, barcodeInputRef]);

  // ---------------------------------------------------------------------------
  // Execute process
  // ---------------------------------------------------------------------------

  const executeProcess = useCallback(async () => {
    try {
      setProcessing(true);
      setError(null);

      const effectiveWindowId = backendWindowId || windowId;
      const actionType = effectiveWindowId === "169" ? "process" : "processHeader";

      const response = await fetch(
        `/api/erp/org.openbravo.client.kernel?processId=${MANAGE_PACKING_PROCESS_ID}&_action=${MANAGE_PACKING_ACTION_HANDLER}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

      if (msgAction?.msgType === "error") {
        setError(msgAction?.msgText || "Process failed");
      } else {
        const parsed = parseSmartClientMessage(msgAction?.msgText || "");
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

  const handleProcess = useCallback(() => {
    const pendingLines = lines.filter((l) => l.qtyPending !== 0);
    if (pendingLines.length > 0) {
      setConfirmDialog({
        open: true,
        message: t("packing.pendingToPack"),
        onConfirm: () => setConfirmDialog((prev) => ({ ...prev, open: false })),
      });
      return;
    }
    executeProcess();
  }, [lines, t, executeProcess]);

  const handleBarcodeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleValidate();
    },
    [handleValidate]
  );

  const handleBoxQtyChange = useCallback(
    (lineIdx: number, boxNum: number, newVal: number) => {
      setLines((prev) => {
        const next = [...prev];
        const updatedLine = { ...next[lineIdx] };
        updatedLine[`box${boxNum}`] = newVal;
        let totalBoxed = 0;
        for (let b = 1; b <= boxCount; b++) totalBoxed += Number(updatedLine[`box${b}`] || 0);
        updatedLine.qtyVerified = totalBoxed;
        updatedLine.boxed = totalBoxed;
        updatedLine.qtyPending = updatedLine.quantity - totalBoxed;
        next[lineIdx] = updatedLine;
        return next;
      });
    },
    [boxCount]
  );

  const handleNavigateToTab = useCallback(
    async (tabId: string, recordId: string) => {
      if (isRecoveryLoading) return;
      try {
        const res = await fetch(`/api/erp/meta/tab/${tabId}?language=en_US`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const tabData = await res.json();
        const resolvedWindowId = tabData?.window || tabData?.windowId || tabId;
        setResultMessage(null);
        onClose();
        const newWindowIdentifier = getNewWindowIdentifier(resolvedWindowId);
        triggerRecovery();
        const newUrlParams = appendWindowToUrl(searchParams, {
          windowIdentifier: newWindowIdentifier,
          tabId,
          recordId,
        });
        router.replace(`window?${newUrlParams}`);
      } catch (e) {
        logger.warn("Failed to resolve tab navigation, falling back to direct", e);
        window.location.href = `/window?wi_0=${tabId}_${Date.now()}&ri_0=${recordId}`;
      }
    },
    [token, isRecoveryLoading, triggerRecovery, searchParams, router, onClose]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) return <LoadingOverlay testId="Loading__3fbaf0" data-testid="LoadingOverlay__3fbaf0" />;

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
            {/* Inputs Bar */}
            <div className="grid grid-cols-12 gap-x-5 gap-y-4 items-end">
              <BoxSelector
                label={t("packing.box")}
                currentBox={currentBox}
                boxCount={boxCount}
                onPrev={() => setCurrentBox((b) => Math.max(1, b - 1))}
                onNext={() => setCurrentBox((b) => Math.min(boxCount, b + 1))}
                data-testid="BoxSelector__3fbaf0"
              />
              <AddBoxButton onClick={handleAddBox} title={t("packing.addBox")} data-testid="AddBoxButton__3fbaf0" />
              <FormInput
                id="packing-qty"
                label={t("packing.quantity")}
                type="number"
                value={currentQty}
                min={0}
                onChange={(e) => setCurrentQty(Number(e.target.value))}
                data-testid="FormInput__3fbaf0"
              />
              <FormInput
                id="packing-barcode"
                label={t("packing.barcode")}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder={t("packing.scanBarcode")}
                inputRef={barcodeInputRef}
                colSpan={5}
                data-testid="FormInput__3fbaf0"
              />
              <ValidateButton
                onClick={handleValidate}
                disabled={processing || !barcodeInput}
                label={t("packing.validateBarcode")}
                testId="Button__3fbaf0"
                data-testid="ValidateButton__3fbaf0"
              />
            </div>

            {/* Error Message */}
            {error && (
              <ErrorAlert
                message={error}
                title={t("process.processError")}
                onDismiss={() => setError(null)}
                testId="CloseIcon__3fbaf0_err"
                data-testid="ErrorAlert__3fbaf0"
              />
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
                            return (
                              <td
                                key={`td-box-${boxNum}-${idx}`}
                                className={`px-2 py-1 whitespace-nowrap text-center ${i < boxCount - 1 ? "border-r" : ""} w-24`}>
                                <input
                                  type="number"
                                  className="w-full text-center border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-1 bg-white border"
                                  value={Number(line[`box${boxNum}`] || 0)}
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
      <ConfirmDialog
        state={confirmDialog}
        title={t("packing.validationError")}
        closeLabel={t("packing.close")}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        testIdPrefix="3fbaf0"
        data-testid="ConfirmDialog__3fbaf0"
      />
      {resultMessage && (
        <ResultMessageModal
          result={resultMessage}
          closeLabel={t("packing.close")}
          onClose={() => {
            setResultMessage(null);
            onClose();
          }}
          testIdPrefix="3fbaf0"
          navigationLink={
            resultMessage.linkTabId && resultMessage.linkRecordId ? (
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
            ) : undefined
          }
          data-testid="ResultMessageModal__3fbaf0"
        />
      )}
    </>
  );
};
