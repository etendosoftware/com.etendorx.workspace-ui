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

import DOMPurify, { type Config } from "dompurify";

/**
 * Locked DOMPurify configuration for the in-modal message bar. Formatting tags
 * only — no anchors, scripts, iframes, forms or inputs; `class` is the sole
 * allowed attribute; every event handler / dangerous attribute is forbidden.
 * Clickable affordances are provided through the structured `actions` parameter
 * of `setMessage`, never through HTML, so this allowlist deliberately omits `<a>`.
 *
 * The config is intentionally not exported nor parameterized: migrated scripts
 * cannot relax it.
 */
const MESSAGE_BAR_SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "br", "span", "p", "ul", "ol", "li", "code"],
  ALLOWED_ATTR: ["class"],
  FORBID_ATTR: ["style", "srcdoc", "formaction", "onerror", "onclick", "onload", "onmouseover"],
  // Defense in depth: with <a> forbidden no URI attribute should reach the
  // sanitizer, but this guards against any future allowlist relaxation.
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  // Ensure the string overload (never RETURN_DOM) is selected.
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitizes a message-bar HTML string with the locked allowlist above.
 * Returns a safe HTML string suitable for `dangerouslySetInnerHTML`.
 *
 * @param text - Raw message text (may contain formatting HTML).
 * @returns Sanitized HTML (formatting tags only).
 */
export function sanitizeMessageHtml(text: string): string {
  if (!text) return "";
  return DOMPurify.sanitize(text, MESSAGE_BAR_SANITIZE_CONFIG);
}
