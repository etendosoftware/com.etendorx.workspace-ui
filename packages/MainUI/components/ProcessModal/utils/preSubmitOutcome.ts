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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/** What happens after a Pick & Execute `onProcess` (Classic `clientSideValidation`) ran. */
export const PRE_SUBMIT_OUTCOME = {
  /** The script called `view.executeProcess()` (Classic `actionHandlerCall()`): that was the submit. */
  SUBMITTED: "submitted",
  /** The script returned an error: abort and show it. */
  ABORT: "abort",
  /** The script returned an error without text: abort without a message (Classic `clientSideValidationFail()`). */
  ABORT_SILENTLY: "abortSilently",
  /** The script let the submit go on: the platform submits. */
  PROCEED: "proceed",
} as const;

export type PreSubmitOutcome = (typeof PRE_SUBMIT_OUTCOME)[keyof typeof PRE_SUBMIT_OUTCOME];

/**
 * Decides the outcome of a Pick & Execute `onProcess`. A script that called
 * `view.executeProcess()` already submitted, whatever it returned; otherwise an
 * error return aborts (silently when it has no text) and anything else lets the
 * platform submit.
 */
export function resolvePreSubmitOutcome(params: {
  executed: boolean;
  msgType?: string;
  msgText?: string;
}): PreSubmitOutcome {
  if (params.executed) return PRE_SUBMIT_OUTCOME.SUBMITTED;
  if (params.msgType !== "error") return PRE_SUBMIT_OUTCOME.PROCEED;
  return params.msgText ? PRE_SUBMIT_OUTCOME.ABORT : PRE_SUBMIT_OUTCOME.ABORT_SILENTLY;
}
