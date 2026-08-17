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

/**
 * Direct-execute mode: the `onLoad` contract that lets a process skip the
 * parameter dialog entirely.
 *
 * A migrated `onLoad` that returns `{ type: "directExecute" }` tells the modal
 * "there is nothing to ask the user — run `onProcess` now". The user sees only a
 * brief loading overlay instead of an empty dialog plus an Execute click.
 *
 * This is what Manual (`uiPattern = "M"`) processes need: they have no
 * parameters, and in Etendo Classic the button handler acts on the click itself.
 * Without it, every migrated Manual process renders an empty modal body.
 *
 * The helpers here are pure so the decision points can be unit-tested without
 * mounting the modal.
 */

/** The `type` discriminator an `onLoad` returns to request direct-execute mode. */
export const DIRECT_EXECUTE_RESULT_TYPE = "directExecute";

/** The `type` discriminator an `onProcess` returns to dismiss the modal without a result. */
export const CLOSE_MODAL_RESULT_TYPE = "closeModal";

/**
 * True iff an `onProcess` return value asks the modal to close silently.
 *
 * This is the equivalent of Classic's `params.button.closeProcessPopup()`, and it
 * is what a migrated script returns when the user declined a `confirm`: nothing
 * ran, so nothing should be reported. Without it, a bare `return` renders as a
 * blank failure banner — in direct-execute mode, on top of a modal that has no
 * chrome to dismiss.
 */
export const isCloseModalResult = (result: unknown): boolean =>
  typeof result === "object" &&
  result !== null &&
  (result as { type?: unknown }).type === CLOSE_MODAL_RESULT_TYPE;

/**
 * True iff an `onLoad` return value requests direct-execute mode.
 *
 * Accepts any shape: `onLoad` bodies are authored in the Application Dictionary
 * and may return `undefined`, a plain object, or an unrelated payload.
 */
export const isDirectExecuteResult = (result: unknown): boolean =>
  typeof result === "object" && result !== null && (result as { type?: unknown }).type === DIRECT_EXECUTE_RESULT_TYPE;

/**
 * True iff the modal should auto-fire `onProcess` on this render.
 *
 * Guards the single firing: the modal must be open, `onLoad` must have requested
 * the mode, and it must not have fired yet for this open session.
 */
export const shouldFireDirectExecute = (params: {
  requested: boolean;
  open: boolean;
  alreadyFired: boolean;
}): boolean => params.requested && params.open && !params.alreadyFired;

/**
 * True iff the modal should render the bare loading overlay instead of its
 * standard chrome.
 *
 * Once execution produces a result the chrome comes back, so an error stays
 * readable and the user can close the dialog.
 */
export const shouldRenderDirectExecuteOverlay = (params: { requested: boolean; hasResult: boolean }): boolean =>
  params.requested && !params.hasResult;
