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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Shape of the parsed banner content used by ProcessDefinitionModal when a
 * `retryExecution` response keeps the modal open and the server emitted an
 * explicit `showMsgInProcessView` action.
 */
export interface ParsedBannerMessage {
  msgText: string;
  isHtml: boolean;
}

/**
 * Reads the candidate banner text from any of the supported shapes returned
 * by `useProcessExecution.parseProcessResponse`. Returns `undefined` when no
 * server-emitted message is present — the banner MUST stay hidden in that
 * case (mirrors Classic, which prints nothing for actions like Search).
 */
export const readBannerRawMessage = (data: unknown): unknown => {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const obj = data as { msgText?: unknown; message?: unknown };
    return obj.msgText ?? obj.message;
  }
  return undefined;
};

/**
 * Reads the server-supplied heading for the in-modal banner (`msgTitle`), the
 * equivalent of Classic's second `messageBar.setMessage` argument. Returns
 * `undefined` for every shape that carries no title — a plain string, an object
 * without `msgTitle`, `null`/`undefined` — so the caller keeps its generic
 * heading ("Process Error", "Process completed successfully", …).
 */
export const readBannerTitle = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") return undefined;
  const { msgTitle } = data as { msgTitle?: unknown };
  return typeof msgTitle === "string" && msgTitle.length > 0 ? msgTitle : undefined;
};

/**
 * Returns the parsed `{msgText, isHtml}` payload for the success banner that
 * appears when the modal stays open after a retry-style response. Returns
 * `null` when the banner must be skipped (no server-side message).
 *
 * `successHint` is the caller-side `isHtml` flag from the parsed result
 * (passed through verbatim) — keeping the OR with the HTML-tag regex matches
 * the prior render behavior.
 */
export const buildSuccessBannerMessage = (
  data: unknown,
  successHint: boolean | undefined
): ParsedBannerMessage | null => {
  const rawMsg = readBannerRawMessage(data);
  if (!rawMsg) return null;
  const msgText = typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);
  const isHtml = Boolean(successHint) || /<[a-z][\s\S]*>/i.test(msgText);
  return { msgText, isHtml };
};
