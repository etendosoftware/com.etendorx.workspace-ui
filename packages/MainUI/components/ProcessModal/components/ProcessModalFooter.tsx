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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * @fileoverview ProcessModalFooter — the action bar of the Process Definition modal.
 *
 * Extracted verbatim from `ProcessDefinitionModal.renderModalContent` so that function stays under
 * the Cognitive Complexity budget. The markup, the class names, the `data-testid`s and the branch
 * conditions are the same ones the modal rendered inline; nothing here decides anything new.
 *
 * It is deliberately presentational: every value and callback arrives as a prop and no hook is
 * called, so it cannot alter the modal's hook order or read a different context than its parent.
 */

import type { ReactNode } from "react";
import Button from "../../../../ComponentLibrary/src/components/Button/Button";
import { REPORT_FORMAT_I18N_KEYS, type ReportOutputFormat } from "@/utils/processes/definition/constants";
import { runFooterButtonAction, type ScriptButtonState } from "@/utils/processes/definition/utils";
import type { TranslateFunction } from "@/hooks/types";

/** One of the process buttons published by the reference list (`availableButtons`). */
export interface FooterActionButton {
  value: string;
  label: string;
  isFilter?: boolean;
}

export interface ProcessModalFooterProps {
  /** Process type is Report and Process, which renders its own Cancel/Execute pair. */
  isReportAndProcess: boolean;
  /** Process is an OBUIAPP report, which renders one export button per output format. */
  isOBUIAPPReport: boolean;
  /** Output formats offered by an OBUIAPP report. */
  reportActions: ReportOutputFormat[];
  /**
   * Whether the action buttons are still relevant — the original `!result || !isFinalSuccess`.
   * Once the process finished successfully the footer only keeps its non-action chrome.
   */
  showActions: boolean;
  isPending: boolean;
  /** Live hidden/disabled/action overrides published by migrated scripts. */
  scriptButtonState: ScriptButtonState;
  availableButtons: FooterActionButton[];
  isActionButtonDisabled: boolean;
  /** Icon and caption of the main action button, resolved by the modal at render time. */
  getActionButtonContent: () => { icon: ReactNode; text: ReactNode };
  onClose: () => void;
  onExecute: (actionValue?: string) => void;
  onReportProcessExecute: () => void;
  t: TranslateFunction;
  getLabel: (label: string) => string;
  "data-testid"?: string;
}

/**
 * Renders the modal's footer. The three families of process (Report and Process, OBUIAPP report,
 * everything else) are mutually exclusive, exactly as they were when this lived inside the modal.
 */
export const ProcessModalFooter = ({
  isReportAndProcess,
  isOBUIAPPReport,
  reportActions,
  showActions,
  isPending,
  scriptButtonState,
  availableButtons,
  isActionButtonDisabled,
  getActionButtonContent,
  onClose,
  onExecute,
  onReportProcessExecute,
  t,
  getLabel,
  "data-testid": dataTestId,
}: ProcessModalFooterProps) => {
  // Same guard the inline markup repeated on its last two blocks.
  const isStandardProcess = !isReportAndProcess && !isOBUIAPPReport;

  return (
    <div className="flex gap-3 justify-end mx-3 my-3" data-testid={dataTestId}>
      {isReportAndProcess && showActions && (
        <>
          {!scriptButtonState.cancelHidden && (
            <Button
              variant="outlined"
              size="large"
              onClick={onClose}
              disabled={isPending}
              className="w-49"
              data-testid="CancelButton__761503">
              {t("common.cancel")}
            </Button>
          )}
          <Button
            variant="filled"
            size="large"
            onClick={onReportProcessExecute}
            disabled={Boolean(isActionButtonDisabled)}
            startIcon={getActionButtonContent().icon}
            className="w-49"
            data-testid="ExecuteReportButton__761503">
            {getActionButtonContent().text}
          </Button>
        </>
      )}

      {isOBUIAPPReport && showActions && (
        <>
          {!scriptButtonState.cancelHidden && (
            <Button
              variant="outlined"
              size="large"
              onClick={onClose}
              disabled={isPending}
              className="w-49"
              data-testid="CancelButton__761503">
              {t("common.cancel")}
            </Button>
          )}
          {reportActions.map((format) => (
            <Button
              key={format}
              variant="filled"
              size="large"
              onClick={() => onExecute(format)}
              disabled={Boolean(isActionButtonDisabled)}
              className="w-49"
              data-testid={`ReportExportButton_${format}__761503`}>
              {getLabel(REPORT_FORMAT_I18N_KEYS[format])}
            </Button>
          ))}
        </>
      )}

      {isStandardProcess && showActions && !isPending && !scriptButtonState.cancelHidden && (
        <Button variant="outlined" size="large" onClick={onClose} className="w-49" data-testid="CloseButton__761503">
          {t("common.close")}
        </Button>
      )}

      {isStandardProcess &&
        (showActions && availableButtons.length > 0
          ? availableButtons
              .filter((btn) => !scriptButtonState.hiddenValues[btn.value])
              .map((btn) => (
                <Button
                  key={btn.value}
                  variant="filled"
                  size="large"
                  onClick={() => runFooterButtonAction(scriptButtonState.actionValues, btn.value, onExecute)}
                  disabled={Boolean(isActionButtonDisabled) || Boolean(scriptButtonState.disabledValues[btn.value])}
                  className="w-49"
                  data-testid={`ExecuteButton_${btn.value}__761503`}>
                  {btn.label}
                </Button>
              ))
          : showActions && (
              <Button
                variant="filled"
                size="large"
                onClick={() => onExecute()}
                disabled={Boolean(isActionButtonDisabled)}
                startIcon={getActionButtonContent().icon}
                className="w-49"
                data-testid="ExecuteButton__761503">
                {getActionButtonContent().text}
              </Button>
            ))}
    </div>
  );
};
