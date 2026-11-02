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

import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { DEFAULT_PROTOCOL, PROTOCOL_SEPARATOR } from "@/utils/menu/externalMenuEntry";

/** Protocols a Link field accepts, the same ones as Classic's `OB.Utilities.isValidURL`. */
const LINK_PROTOCOLS = new Set(["http:", "https:", "ftp:", "file:"]);
/** Characters Classic never accepts in a URL; `new URL` would silently percent-encode them. */
const FORBIDDEN_URL_CHARS = /[\s<>"{}|\\^`]/;
const IPV4_HOST = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const HOST_LABEL_CHARS = /^[\w~-]+$/;
const ALPHANUMERIC_CHAR = /^[a-z\d]$/;
const LETTER_CHAR = /^[a-z]$/;
const HOST_LABEL_SEPARATOR = ".";

const withDefaultProtocol = (url: string): string =>
  url.includes(PROTOCOL_SEPARATOR) ? url : `${DEFAULT_PROTOCOL}${url}`;

const parseUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

const hasLinkProtocol = (url: URL | null): url is URL => url !== null && LINK_PROTOCOLS.has(url.protocol);

/** A host label made of unreserved characters that starts and ends with a char matching `edgeChar`. */
const isHostLabel = (label: string, edgeChar: RegExp): boolean =>
  HOST_LABEL_CHARS.test(label) && edgeChar.test(label[0]) && edgeChar.test(label[label.length - 1]);

/**
 * Applies Classic's host rule: an IPv4 address, or at least two dot-separated labels whose last one
 * (the top-level domain) starts and ends with a letter. So `localhost` is rejected, as in Classic.
 */
const isValidHostName = (hostname: string): boolean => {
  const host = hostname.endsWith(HOST_LABEL_SEPARATOR) ? hostname.slice(0, -1) : hostname;
  if (IPV4_HOST.test(host)) return true;
  const labels = host.split(HOST_LABEL_SEPARATOR);
  const topLevelLabel = labels[labels.length - 1];
  return (
    labels.length > 1 &&
    labels.slice(0, -1).every((label) => isHostLabel(label, ALPHANUMERIC_CHAR)) &&
    isHostLabel(topLevelLabel, LETTER_CHAR)
  );
};

/** Tells whether a column reference is the Link reference (URL fields). */
export const isLinkReference = (reference?: string | null): boolean => reference === FIELD_REFERENCE_CODES.LINK.id;

/**
 * Turns the value of a Link field into the URL to open: prepends `http://` when it has no protocol
 * (e.g. `www.etendo.software`), as Classic does, so the browser does not resolve it as a path of the app.
 *
 * @returns the URL to open, or `null` when the value is empty or its protocol is not a Link one
 * (e.g. `javascript://`), so it never reaches the browser.
 */
export const toOpenableLinkUrl = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const url = withDefaultProtocol(trimmed);
  return hasLinkProtocol(parseUrl(url)) ? url : null;
};

/**
 * Validates the value of a Link field with the rules of Classic's `OB.Utilities.isValidURL`
 * (http, https, ftp or file protocol, and a dotted host name or an IPv4 address), checked on the value
 * with `http://` prepended when it has no protocol. Classic's regular expression is not reused: it
 * backtracks exponentially on values such as `http://a.a.a.…-`, which would freeze the browser tab.
 *
 * @returns `true` for an empty value, since mandatory fields are checked elsewhere.
 */
export const isValidLinkUrl = (value: unknown): boolean => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return true;
  const url = withDefaultProtocol(trimmed);
  if (FORBIDDEN_URL_CHARS.test(url)) return false;
  const parsed = parseUrl(url);
  return hasLinkProtocol(parsed) && isValidHostName(parsed.hostname);
};
