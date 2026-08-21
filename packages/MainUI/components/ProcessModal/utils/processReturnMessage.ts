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
 * Pure reader for the standalone `message` object an Etendo process carries
 * outside `responseActions[]`.
 *
 * Etendo Classic handlers answer with `{ message: { severity, title, text } }`
 * and the classic client renders all three
 * (`view.view.messageBar.setMessage(TYPE_<severity>, title, text)`), so a
 * migrated `onProcess` returns the same three fields under the script-facing
 * spelling `{ msgType, msgTitle, msgText }`. Both spellings are accepted here:
 * a migrated script may map the response, or hand it back untouched.
 */

import type { ProcessActionMessage } from "./responseActionDispatcher";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Returns the value only when it is a non-empty string; `undefined` otherwise. */
const readText = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

/**
 * Reads the raw `message` field from the three nesting levels Etendo Classic
 * handlers use, mirroring {@link readProcessResponseFlag} and
 * {@link readResponseActions}: top-level, `response.message`,
 * `response.data.message`.
 */
const readRawMessage = (data: unknown): unknown => {
  if (!isPlainObject(data)) return undefined;
  if (data.message !== undefined) return data.message;
  const response = isPlainObject(data.response) ? data.response : undefined;
  if (response?.message !== undefined) return response.message;
  const nested = response && isPlainObject(response.data) ? response.data : undefined;
  return nested?.message;
};

/**
 * Normalizes the returned `message` into the canonical
 * {@link ProcessActionMessage} shape used by the modal's toast and banner.
 *
 * Returns `null` when there is no usable message — no `message` field, a
 * non-object/non-string value, or an object carrying neither text nor title.
 * Callers must keep their own default texts in that case: absence of a message
 * is not an outcome, so it must never overwrite a caller's fallback.
 *
 * @param data any process return value or handler response
 * @returns the normalized message, or `null` when none is present
 */
export const readReturnedMessage = (data: unknown): ProcessActionMessage | null => {
  const raw = readRawMessage(data);

  // `{ message: "some text" }` — the shape `readBannerRawMessage` also accepts.
  const asText = readText(raw);
  if (asText) return { msgText: asText };

  if (!isPlainObject(raw)) return null;

  const msgType = readText(raw.msgType) ?? readText(raw.severity);
  const msgTitle = readText(raw.msgTitle) ?? readText(raw.title);
  const msgText = readText(raw.msgText) ?? readText(raw.text);

  // A message with a severity but no words to show carries no information for
  // the user, so it must not displace the caller's default text.
  if (!msgTitle && !msgText) return null;

  return {
    ...(msgType ? { msgType } : {}),
    ...(msgTitle ? { msgTitle } : {}),
    ...(msgText ? { msgText } : {}),
  };
};

/**
 * The severity to assume for a returned message that carries none of its own.
 *
 * Etendo's own framework always types its answer — `BaseProcessActionHandler` and
 * `ResponseActionsBuilder` both `put("severity", …)` — so an **object-shaped** `message`
 * that arrives untyped comes from the legacy module idiom, where `severity` is written
 * only on the success path. The SII handlers are the documented case: their validation
 * and failure answers are `{ title: <translated "Error" label>, text }` and nothing else,
 * and Classic paints exactly those red (`OB.AEATSII.execute` ends its branch in
 * `else → TYPE_ERROR`). Assuming success there would swallow a server error *and* close
 * the modal on top of it, so an untyped handler message defaults to `error`.
 *
 * A bare string message (`{ message: "…" }`) is not a handler answer but a script saying
 * something, and keeps the success default.
 *
 * The severity a message *does* carry always wins over this default; this only fills the
 * gap. Callers must spread the read message after it.
 *
 * @param data the same process return value passed to {@link readReturnedMessage}
 * @returns `"error"` for an untyped handler-shaped message, `"success"` otherwise
 */
export const resolveDefaultMsgType = (data: unknown): "success" | "error" =>
  isPlainObject(readRawMessage(data)) ? "error" : "success";
