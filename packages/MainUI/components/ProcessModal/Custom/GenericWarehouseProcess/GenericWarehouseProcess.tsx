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
 * @fileoverview GenericWarehouseProcess — schema-driven warehouse process modal.
 *
 * This component replaces the hardcoded PackingProcess and PickValidateProcess components.
 * It renders any warehouse process (packing, picking, or future ones) by reading:
 *   - WarehouseProcessSchema (from onLoad evaluation) → structure + initial data
 *   - WarehousePayScriptPlugin (from Payscript registry) → onScan logic
 *
 * The module developer controls everything via three AD fields on ProcessDefinition:
 *   - onLoad     → returns WarehouseProcessSchema (structure + initial data fetch)
 *   - onProcess  → executes the final "confirm" action
 *   - payscript  → declares the onScan hook
 */

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { logger } from "@/utils/logger";
import { executeStringFunction } from "@/utils/functions";
import { createCallAction } from "./warehouseApiHelpers";
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
  ErrorAlert,
  ConfirmDialog,
  ResultMessageModal,
  BoxSelector,
  AddBoxButton,
  FormInput,
  BarcodeInputRow,
} from "../shared/ProcessModalShared";
import type {
  WarehouseProcessSchema,
  WarehousePayScriptPlugin,
  WarehouseLine,
  OnScanResult,
  OnScanError,
} from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GenericWarehouseProcessProps {
  schema: WarehouseProcessSchema;
  payscriptPlugin: WarehousePayScriptPlugin | null;
  /** Raw onProcess function string from processDefinition.onProcess */
  onProcessCode: string | undefined;
  processId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const GenericWarehouseProcess: React.FC<GenericWarehouseProcessProps> = ({
  schema,
  payscriptPlugin,
  onProcessCode,
  processId,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { token } = useUserContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { triggerRecovery, isRecoveryLoading } = useWindowContext();

  // ---------------------------------------------------------------------------
  // State — initialized from schema.initialData
  // ---------------------------------------------------------------------------

  const [lines, setLines] = useState<WarehouseLine[]>(() => schema.initialData.lines);
  const [checkCalculate, setCheckCalculate] = useState(schema.initialData.valuecheck ?? false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<ResultMessage | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(INITIAL_CONFIRM_DIALOG);

  // Form state
  const [currentQty, setCurrentQty] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Box management
  const { boxCount, currentBox, setBoxCount, setCurrentBox, barcodeInputRef } = useBoxManager();

  // Initialize boxCount from schema
  useEffect(() => {
    setBoxCount(schema.initialData.boxCount ?? 1);
    setCurrentBox(1);
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, [schema.initialData.boxCount, setBoxCount, setCurrentBox, barcodeInputRef]);

  // ---------------------------------------------------------------------------
  // Sandbox callAction — shared by both onScan and onProcess
  // ---------------------------------------------------------------------------

  // Created via shared factory function to avoid duplication with useWarehousePlugin.
  // token is guaranteed non-null here — the parent modal only renders this component after auth.
  const callAction = useMemo(() => createCallAction(token ?? "", processId), [token, processId]);

  // ---------------------------------------------------------------------------
  // Add box
  // ---------------------------------------------------------------------------

  const handleAddBox = useCallback(() => {
    const newBoxNo = boxCount + 1;
    setBoxCount(newBoxNo);
    setCurrentBox(newBoxNo);
    setLines((prev) => prev.map((line) => ({ ...line, [`box${newBoxNo}`]: 0 })));
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, [boxCount, setBoxCount, setCurrentBox, barcodeInputRef]);

  // ---------------------------------------------------------------------------
  // Validate barcode — delegates to Payscript onScan hook
  // ---------------------------------------------------------------------------

  const handleValidate = useCallback(async () => {
    if (!barcodeInput) return;
    if (!payscriptPlugin?.onScan) {
      setError("No onScan handler registered for this process");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const result = await payscriptPlugin.onScan({
        barcode: barcodeInput,
        qty: currentQty,
        currentBox,
        lines,
        callAction,
      });

      if ("error" in result && result.error) {
        setError((result as OnScanError).message ?? t("packing.wrongBarcode"));
        return;
      }

      const { matchField, matchValue, qty: qtyToAdd, scannedCode } = result as OnScanResult;
      // Use the backend-normalized code if provided, otherwise fall back to raw user input
      const codeToRecord = scannedCode ?? barcodeInput;

      setLines((prev) => {
        const next = [...prev];
        const matchedIndex = next.findIndex((l) => String(l[matchField]) === String(matchValue));

        if (matchedIndex < 0) return prev;

        const line = { ...next[matchedIndex] };
        const boxKey = `box${currentBox}`;
        line[boxKey] = Number(line[boxKey] || 0) + qtyToAdd;

        // Recalculate totals
        let totalBoxed = 0;
        for (let i = 1; i <= boxCount; i++) totalBoxed += Number(line[`box${i}`] || 0);
        line.qtyVerified = totalBoxed;
        line.boxed = totalBoxed;
        line.qtyPending = line.quantity - totalBoxed;

        // Track scannedInputs if feature enabled
        if (schema.features.trackScannedInputs) {
          line.scannedInputs = [
            ...((line.scannedInputs as { code: string; qty: number }[]) || []),
            { code: codeToRecord, qty: qtyToAdd },
          ];
        }

        next[matchedIndex] = line;
        return next;
      });

      setBarcodeInput("");
      setCurrentQty(1);
    } catch (e) {
      logger.error("[GenericWarehouseProcess] onScan error", e);
      setError("Validation failed");
    } finally {
      setProcessing(false);
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [
    barcodeInput,
    payscriptPlugin,
    currentQty,
    currentBox,
    lines,
    boxCount,
    callAction,
    schema.features.trackScannedInputs,
    t,
    barcodeInputRef,
  ]);

  // ---------------------------------------------------------------------------
  // Handle inline box qty edit
  // ---------------------------------------------------------------------------

  const handleBoxQtyChange = useCallback(
    (lineIdx: number, boxNum: number, newVal: number) => {
      setLines((prev) => {
        const next = [...prev];
        const line = { ...next[lineIdx] };
        line[`box${boxNum}`] = newVal;
        let totalBoxed = 0;
        for (let b = 1; b <= boxCount; b++) totalBoxed += Number(line[`box${b}`] || 0);
        line.qtyVerified = totalBoxed;
        line.boxed = totalBoxed;
        line.qtyPending = line.quantity - totalBoxed;
        next[lineIdx] = line;
        return next;
      });
    },
    [boxCount]
  );

  // Handle the editable qtyVerified column (used in picking)
  const handleQtyVerifiedChange = useCallback(
    (lineIdx: number, newVal: number) => {
      setLines((prev) => {
        const next = [...prev];
        const line = { ...next[lineIdx] };
        const oldVal = line.qtyVerified || 0;
        const delta = newVal - oldVal;
        line.qtyVerified = newVal;
        line.qtyPending = line.quantity - newVal;
        if (schema.features.trackScannedInputs) {
          const inputs = [...((line.scannedInputs as { code: string; qty: number }[]) || [])];
          if (delta > 0) {
            inputs.push({ code: "", qty: delta });
          } else if (delta < 0) {
            let remaining = Math.abs(delta);
            while (remaining > 0 && inputs.length > 0) {
              inputs.pop();
              remaining -= 1;
            }
          }
          line.scannedInputs = inputs;
        }
        next[lineIdx] = line;
        return next;
      });
    },
    [schema.features.trackScannedInputs]
  );

  // ---------------------------------------------------------------------------
  // Execute process — delegates to onProcess string function
  // ---------------------------------------------------------------------------

  const executeProcess = useCallback(async () => {
    try {
      setProcessing(true);
      setError(null);

      let data: Record<string, unknown>;

      if (onProcessCode) {
        // Execute the onProcess function declared in the module
        const context = { callAction };
        data = await executeStringFunction(onProcessCode.trim(), context, {
          lines,
          boxCount,
          recordId: schema.recordId,
          windowId: schema.initialData.windowId,
          calculateWeight: checkCalculate,
        });
      } else {
        throw new Error("No onProcess function defined for this process");
      }

      const responseActions = (data as Record<string, unknown[]>).responseActions;
      const msgAction = (Array.isArray(responseActions) ? responseActions[0] : {}) as Record<
        string,
        Record<string, string>
      >;
      const showMsg = msgAction?.showMsgInProcessView;

      if (showMsg?.msgType === "error") {
        setError(showMsg?.msgText || "Process failed");
      } else {
        const parsed = parseSmartClientMessage(showMsg?.msgText || "");
        const msgType = showMsg?.msgType;
        setResultMessage({
          type: (msgType === "success" || msgType === "warning" || msgType === "error"
            ? msgType
            : "success") satisfies ResultMessage["type"],
          // biome-ignore lint/suspicious/noExplicitAny: titleKey is a dynamic schema string — not a static translation key
          title: showMsg?.msgTitle || t(schema.titleKey as any),
          text: parsed.text || t("process.processError"),
          linkTabId: parsed.tabId,
          linkRecordId: parsed.recordId,
        });
      }
    } catch (e) {
      logger.error("[GenericWarehouseProcess] executeProcess error", e);
      setError("Processing failed");
    } finally {
      setProcessing(false);
    }
  }, [onProcessCode, callAction, lines, boxCount, schema, checkCalculate, t]);

  // ---------------------------------------------------------------------------
  // Handle process button click — validates before executing
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Navigation helper (for result message link)
  // ---------------------------------------------------------------------------

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
        logger.warn("[GenericWarehouseProcess] Tab navigation failed, falling back", e);
        window.location.href = `/window?wi_0=${tabId}_${Date.now()}&ri_0=${recordId}`;
      }
    },
    [token, isRecoveryLoading, triggerRecovery, searchParams, router, onClose]
  );

  const handleResultClose = useCallback(async () => {
    setResultMessage(null);
    onSuccess?.();
    onClose();
  }, [onClose, onSuccess]);

  // ---------------------------------------------------------------------------
  // Derive visible columns from schema
  // ---------------------------------------------------------------------------

  const visibleColumns = schema.gridColumns.filter((c) => c.visible !== false);
  const hasDynamicBoxCols = schema.features.dynamicBoxes !== false;
  const hasQtyVerifiedCol = schema.gridColumns.some((c) => c.field === "qtyVerified");

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
            {/* biome-ignore lint/suspicious/noExplicitAny: titleKey is a dynamic schema string — not a static translation key */}
            <h3 className="text-lg font-bold">{t(schema.titleKey as any)}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-(--color-baseline-10) transition-colors"
              disabled={processing}>
              <CloseIcon className="w-5 h-5 text-gray-500" data-testid="CloseIcon__cad053" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 min-h-[12rem] flex flex-col gap-4">
            {/* Input bar — rendered based on schema.inputBar order */}
            <div className="grid grid-cols-12 gap-x-5 gap-y-4 items-end">
              {schema.inputBar.includes("boxSelector") && (
                <BoxSelector
                  label={t("packing.box")}
                  currentBox={currentBox}
                  boxCount={boxCount}
                  onPrev={() => setCurrentBox((b) => Math.max(1, b - 1))}
                  onNext={() => setCurrentBox((b) => Math.min(boxCount, b + 1))}
                  data-testid="BoxSelector__cad053"
                />
              )}
              {schema.inputBar.includes("addBox") && schema.features.dynamicBoxes !== false && (
                <AddBoxButton onClick={handleAddBox} title={t("packing.addBox")} data-testid="AddBoxButton__cad053" />
              )}
              {schema.inputBar.includes("qty") && (
                <FormInput
                  id="warehouse-qty"
                  label={t("packing.quantity")}
                  type="number"
                  value={currentQty}
                  min={0}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                  data-testid="FormInput__cad053"
                />
              )}
              {schema.inputBar.includes("barcode") && (
                <BarcodeInputRow
                  id="warehouse-barcode"
                  label={t("packing.barcode")}
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder={t("packing.scanBarcode")}
                  inputRef={barcodeInputRef}
                  onValidate={handleValidate}
                  validateDisabled={processing || !barcodeInput}
                  validateLabel={t("packing.validateBarcode")}
                  validateTestId="Button__warehouse_validate"
                  colSpan={6}
                  data-testid="BarcodeInputRow__cad053"
                />
              )}
            </div>

            {/* Error */}
            {error && (
              <ErrorAlert
                message={error}
                title={t("process.processError")}
                onDismiss={() => setError(null)}
                testId="CloseIcon__warehouse_err"
                data-testid="ErrorAlert__cad053"
              />
            )}

            {/* Grid */}
            <div className="flex-1 overflow-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.field}
                        className={`px-3 py-2.5 text-${col.align ?? "left"} text-xs font-bold text-gray-500 uppercase tracking-wider border-r`}>
                        {/* biome-ignore lint/suspicious/noExplicitAny: labelKey is a dynamic schema string — not a static translation key */}
                        {t(col.labelKey as any)}
                      </th>
                    ))}
                    {/* Status column always last */}
                    <th className="px-3 py-2.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r w-16">
                      {t("packing.status")}
                    </th>
                    {/* Dynamic box columns */}
                    {hasDynamicBoxCols &&
                      Array.from({ length: boxCount }).map((_, i) => (
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
                      <td
                        colSpan={visibleColumns.length + 1 + (hasDynamicBoxCols ? boxCount : 0)}
                        className="px-3 py-8 text-center text-sm text-gray-400">
                        {t("packing.noLines")}
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, idx) => {
                      const isComplete = line.qtyPending === 0 && (line.qtyVerified > 0 || Number(line.boxed ?? 0) > 0);
                      const isOver =
                        line.qtyPending < 0 || (hasQtyVerifiedCol && Number(line.qtyVerified) > line.quantity);

                      let rowBg = "";
                      if (isOver) rowBg = "bg-red-50";
                      else if (isComplete) rowBg = "bg-green-50";

                      let statusColor = "text-gray-300";
                      if (isComplete) statusColor = "text-green-500";
                      else if (isOver) statusColor = "text-red-500";

                      return (
                        <tr key={String(line.shipmentLineId) || idx} className={`hover:bg-gray-50 ${rowBg}`}>
                          {visibleColumns.map((col) => {
                            const cellVal = line[col.field];

                            // Editable qtyVerified (used in picking)
                            if (col.field === "qtyVerified" && col.editable) {
                              return (
                                <td key={col.field} className="px-2 py-1 whitespace-nowrap text-center border-r w-28">
                                  <input
                                    type="number"
                                    className="w-full text-center border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm p-1 bg-white border"
                                    value={Number(cellVal ?? 0)}
                                    min={0}
                                    onChange={(e) => handleQtyVerifiedChange(idx, Math.max(0, Number(e.target.value)))}
                                  />
                                </td>
                              );
                            }

                            // qtyPending with color
                            if (col.field === "qtyPending") {
                              const pendingColor = isOver
                                ? "text-red-600"
                                : isComplete
                                  ? "text-green-600"
                                  : "text-gray-900";
                              return (
                                <td
                                  key={col.field}
                                  className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold border-r">
                                  <span className={pendingColor}>{String(cellVal ?? "—")}</span>
                                </td>
                              );
                            }

                            // Default cell
                            return (
                              <td
                                key={col.field}
                                className={`px-3 py-2 whitespace-nowrap text-sm text-${col.align ?? "left"} text-gray-900 border-r`}>
                                {String(cellVal ?? "—")}
                              </td>
                            );
                          })}

                          {/* Status dot */}
                          <td className="px-3 py-2 whitespace-nowrap text-center border-r">
                            <span className={`text-lg ${statusColor}`}>●</span>
                          </td>

                          {/* Dynamic box inputs */}
                          {hasDynamicBoxCols &&
                            Array.from({ length: boxCount }).map((_, i) => {
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

          {/* Footer */}
          <div className="flex items-center justify-between mx-4 my-3 pt-3 border-t border-gray-100 shrink-0">
            <div className="flex items-center">
              {schema.inputBar.includes("checkCalculate") && schema.features.calculateWeight && (
                <>
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
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outlined" size="large" onClick={onClose} className="w-32" data-testid="Button__cad053">
                {t("packing.cancel")}
              </Button>
              <Button
                variant="filled"
                size="large"
                onClick={handleProcess}
                disabled={processing}
                className="w-48 flex items-center justify-center gap-2"
                data-testid="Button__cad053">
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
        testIdPrefix="warehouse"
        data-testid="ConfirmDialog__cad053"
      />
      {resultMessage && (
        <ResultMessageModal
          result={resultMessage}
          closeLabel={t("packing.close")}
          onClose={handleResultClose}
          testIdPrefix="warehouse"
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
          data-testid="ResultMessageModal__cad053"
        />
      )}
    </>
  );
};
