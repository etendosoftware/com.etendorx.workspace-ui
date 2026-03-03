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
 * @fileoverview Shared utilities and types for custom process modal components
 * (PackingProcess, PickValidateProcess, and future custom processes).
 */

// ---------------------------------------------------------------------------
// Shared Types
// ---------------------------------------------------------------------------

export interface ScannedInput {
  code: string;
  qty: number;
}

export interface ResultMessage {
  type: "success" | "warning" | "error";
  title: string;
  text: string;
  /** If the backend returned an openDirectTab link, these hold the navigation target */
  linkTabId?: string;
  linkRecordId?: string;
}

export interface ConfirmDialogState {
  open: boolean;
  message: string;
  onConfirm: () => void;
}

export const INITIAL_CONFIRM_DIALOG: ConfirmDialogState = {
  open: false,
  message: "",
  onConfirm: () => {},
};

// ---------------------------------------------------------------------------
// parseSmartClientMessage
// ---------------------------------------------------------------------------

/**
 * Extract openDirectTab params from SmartClient HTML messages.
 * Returns the tabId, recordId, and cleaned text (without HTML).
 */
export const parseSmartClientMessage = (html: string): { text: string; tabId?: string; recordId?: string } => {
  // Extract openDirectTab params using simple string search (avoids regex backtracking)
  let tabId: string | undefined;
  let recordId: string | undefined;
  const marker = "openDirectTab(";
  const idx = html.indexOf(marker);
  if (idx !== -1) {
    const argsStart = idx + marker.length;
    const argsEnd = html.indexOf(")", argsStart);
    if (argsEnd !== -1) {
      const argsStr = html.substring(argsStart, argsEnd);
      const args = argsStr.split(",").map((s) => s.replace(/["'\s]/g, ""));
      tabId = args[0] || undefined;
      recordId = args[1] || undefined;
    }
  }

  // Strip HTML tags using a safe character-by-character approach
  let cleanText = html;
  const anchorStart = cleanText.indexOf("<a");
  if (anchorStart !== -1) {
    const anchorEnd = cleanText.indexOf("</a>", anchorStart);
    if (anchorEnd !== -1) {
      cleanText = cleanText.substring(0, anchorStart) + cleanText.substring(anchorEnd + 4);
    }
  }
  let result = "";
  let inTag = false;
  for (const ch of cleanText) {
    if (ch === "<") inTag = true;
    else if (ch === ">") inTag = false;
    else if (!inTag) result += ch;
  }

  return { text: result.trim(), tabId, recordId };
};
